import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { S3Client } from "bun";
import { HTTPException } from "hono/http-exception";

const LEADING_SLASH_EXPRESSION = /^\/+/u;
const NORMALIZE_SLASH_EXPRESSION = /\/{2,}/gu;
const TRAILING_SLASH_EXPRESSION = /\/+$/u;
const INVALID_FILE_CHARS_EXPRESSION = /[^a-zA-Z0-9._-]/gu;
const INVALID_FOLDER_CHARS_EXPRESSION = /[^a-zA-Z0-9/_-]/u;
const DEFAULT_DOWNLOAD_URL_EXPIRES_SECONDS = 60 * 60;
const FILE_NOT_FOUND_RESPONSE = new Response("File not found", { status: 404 });
const DOWNLOAD_URL_EXPIRED_RESPONSE = new Response("Download URL expired", {
  status: 410,
});
const INVALID_DOWNLOAD_SIGNATURE_RESPONSE = new Response(
  "Invalid download signature",
  { status: 403 }
);
const MISSING_DOWNLOAD_PARAMETERS_RESPONSE = new Response(
  "Missing download parameters",
  { status: 400 }
);
const INVALID_STORAGE_MODE_RESPONSE = new Response("Not found", {
  status: 404,
});
const APPLICATION_OCTET_STREAM = "application/octet-stream";

const bunRuntime = globalThis.Bun;

if (!bunRuntime) {
  throw new Error("Bun runtime is required for file uploads");
}

export interface UploadFileInput {
  file: File;
  venueId: string;
  folder?: string;
}

export interface UploadedFile {
  key: string;
  size: number;
  name: string;
  mimeType: string;
}

interface DownloadUrlInput {
  key: string;
  requestOrigin: string;
  expiresIn?: number;
}

let fileUploadServiceInstance: FileUploadService | undefined;

class FileUploadService {
  private readonly storageMode: "local" | "s3";
  private readonly s3Client: S3Client | null;
  private readonly storageRootDirectory: string;
  private readonly localDownloadSecret: string;

  private constructor() {
    const hasS3Configuration =
      Boolean(process.env.S3_BUCKET) &&
      Boolean(process.env.S3_REGION) &&
      Boolean(process.env.S3_ACCESS_KEY_ID) &&
      Boolean(process.env.S3_SECRET_ACCESS_KEY);
    const shouldUseLocalStorage =
      process.env.NODE_ENV !== "production" && !hasS3Configuration;

    this.storageMode = shouldUseLocalStorage ? "local" : "s3";
    this.localDownloadSecret = process.env.BETTER_AUTH_SECRET;
    this.storageRootDirectory = path.join(
      process.cwd(),
      ".workflow-data",
      "file-uploads"
    );

    if (this.storageMode === "local") {
      this.s3Client = null;
      return;
    }

    if (!hasS3Configuration) {
      throw new Error(
        "Missing S3 configuration. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY."
      );
    }

    this.s3Client = new S3Client({
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
    });
  }

  static getInstance(): FileUploadService {
    if (!fileUploadServiceInstance) {
      fileUploadServiceInstance = new FileUploadService();
    }
    return fileUploadServiceInstance;
  }

  async uploadFile(input: UploadFileInput): Promise<UploadedFile> {
    const folder = this.normalizeFolder(input.folder);
    const key = this.buildStorageKey({
      venueId: input.venueId,
      folder,
      fileName: input.file.name,
    });

    if (this.storageMode === "local") {
      const absoluteFilePath = this.getAbsoluteFilePath(key);
      await mkdir(path.dirname(absoluteFilePath), { recursive: true });
      await bunRuntime.write(absoluteFilePath, input.file);
    } else {
      if (!this.s3Client) {
        throw new Error("S3 client is not configured");
      }

      const fileType = input.file.type || APPLICATION_OCTET_STREAM;
      await this.s3Client.file(key).write(input.file, {
        type: fileType,
      });
    }

    return {
      key,
      size: input.file.size,
      name: input.file.name,
      mimeType: input.file.type || APPLICATION_OCTET_STREAM,
    };
  }

  async deleteFile(key: string): Promise<void> {
    try {
      if (this.storageMode === "local") {
        const absoluteFilePath = this.getAbsoluteFilePath(key);
        await rm(absoluteFilePath, { force: true });
        return;
      }

      if (!this.s3Client) {
        throw new Error("S3 client is not configured");
      }

      await this.s3Client.file(key).unlink();
    } catch (error) {
      console.error(
        "[FileUploadService] Failed to delete file",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  getDownloadUrl(input: DownloadUrlInput): string {
    const expiresIn = input.expiresIn ?? DEFAULT_DOWNLOAD_URL_EXPIRES_SECONDS;

    if (this.storageMode === "local") {
      const expiresAt = Date.now() + expiresIn * 1000;
      const signature = this.signLocalDownloadPayload(input.key, expiresAt);
      const queryParameters = new URLSearchParams({
        key: input.key,
        expiresAt: String(expiresAt),
        signature,
      });

      return `${this.normalizeOrigin(input.requestOrigin)}/api/public/files/local?${queryParameters.toString()}`;
    }

    if (!this.s3Client) {
      throw new Error("S3 client is not configured");
    }

    return this.s3Client.presign(input.key, { expiresIn });
  }

  async getLocalFileResponse(key: string): Promise<Response> {
    if (this.storageMode !== "local") {
      return INVALID_STORAGE_MODE_RESPONSE;
    }

    const absoluteFilePath = this.getAbsoluteFilePath(key);
    const localFile = bunRuntime.file(absoluteFilePath);

    if (!(await localFile.exists())) {
      return FILE_NOT_FOUND_RESPONSE;
    }

    const fileName = key.split("/").at(-1) ?? "file";

    return new Response(localFile, {
      headers: {
        "Content-Type": localFile.type || APPLICATION_OCTET_STREAM,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  }

  async getLocalDownloadResponse(request: Request): Promise<Response> {
    if (this.storageMode !== "local") {
      return INVALID_STORAGE_MODE_RESPONSE;
    }

    const requestUrl = new URL(request.url);
    const key = requestUrl.searchParams.get("key");
    const expiresAt = requestUrl.searchParams.get("expiresAt");
    const signature = requestUrl.searchParams.get("signature");

    if (!(key && expiresAt && signature)) {
      return MISSING_DOWNLOAD_PARAMETERS_RESPONSE;
    }

    const expiresAtMs = Number(expiresAt);

    if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
      return DOWNLOAD_URL_EXPIRED_RESPONSE;
    }

    const expectedSignature = this.signLocalDownloadPayload(key, expiresAtMs);

    if (!this.safeCompare(signature, expectedSignature)) {
      return INVALID_DOWNLOAD_SIGNATURE_RESPONSE;
    }

    return await this.getLocalFileResponse(key);
  }

  isLocalStorageMode(): boolean {
    return this.storageMode === "local";
  }

  private normalizeFolder(folder?: string): string | null {
    if (!folder) {
      return null;
    }

    const normalizedFolder = folder
      .trim()
      .replace(LEADING_SLASH_EXPRESSION, "")
      .replace(TRAILING_SLASH_EXPRESSION, "")
      .replace(NORMALIZE_SLASH_EXPRESSION, "/");

    if (!normalizedFolder) {
      return null;
    }

    if (INVALID_FOLDER_CHARS_EXPRESSION.test(normalizedFolder)) {
      throw new HTTPException(400, { message: "Invalid upload folder" });
    }

    return normalizedFolder;
  }

  private buildStorageKey(input: {
    venueId: string;
    folder: string | null;
    fileName: string;
  }) {
    const safeFileName = this.sanitizeFileName(input.fileName);
    const folderPath = input.folder ? `${input.folder}/` : "";
    return `venue/${input.venueId}/${folderPath}${Date.now()}-${randomUUID()}-${safeFileName}`;
  }

  private sanitizeFileName(fileName: string): string {
    const sanitizedFileName = fileName
      .trim()
      .replace(INVALID_FILE_CHARS_EXPRESSION, "_");

    if (!sanitizedFileName) {
      return "upload";
    }

    return sanitizedFileName;
  }

  private getAbsoluteFilePath(key: string): string {
    const normalizedKey = key.replace(LEADING_SLASH_EXPRESSION, "");
    const rootDirectoryPath = path.resolve(this.storageRootDirectory);
    const absoluteFilePath = path.resolve(rootDirectoryPath, normalizedKey);

    if (!this.isWithinDirectory(absoluteFilePath, rootDirectoryPath)) {
      throw new HTTPException(400, { message: "Invalid file key" });
    }

    return absoluteFilePath;
  }

  private isWithinDirectory(targetPath: string, rootDirectoryPath: string) {
    return (
      targetPath === rootDirectoryPath ||
      targetPath.startsWith(`${rootDirectoryPath}${path.sep}`)
    );
  }

  private signLocalDownloadPayload(key: string, expiresAtMs: number): string {
    const payload = `${key}:${expiresAtMs}`;

    return createHmac("sha256", this.localDownloadSecret)
      .update(payload)
      .digest("hex");
  }

  private safeCompare(inputValue: string, expectedValue: string): boolean {
    const inputBuffer = Buffer.from(inputValue);
    const expectedBuffer = Buffer.from(expectedValue);

    if (inputBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(inputBuffer, expectedBuffer);
  }

  private normalizeOrigin(origin: string): string {
    return origin.endsWith("/") ? origin.slice(0, -1) : origin;
  }
}

const Service = FileUploadService.getInstance();

export { Service as FileUploadService };
