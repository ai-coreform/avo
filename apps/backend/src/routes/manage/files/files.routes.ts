import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { FileUploadService } from "@/lib/file-upload";
import { requireOrgAdmin } from "@/middleware/org-admin";
import {
  createUploadedFile,
  deleteUploadedFileByIdAndVenue,
  getUploadedFileByIdAndVenue,
} from "./files.service";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DOWNLOAD_EXPIRY_SECONDS = 24 * 60 * 60;

type ParsedBodyValue = string | File | (string | File)[] | undefined;

const fileIdParamSchema = z.object({
  fileId: z.string().uuid(),
});

const downloadUrlQuerySchema = z.object({
  expiresIn: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_DOWNLOAD_EXPIRY_SECONDS)
    .optional(),
});

function extractFile(value: ParsedBodyValue): File | null {
  if (value instanceof File) {
    return value;
  }

  if (Array.isArray(value)) {
    const fileValue = value.find((entry) => entry instanceof File);
    return fileValue instanceof File ? fileValue : null;
  }

  return null;
}

function extractString(value: ParsedBodyValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const stringValue = value.find((entry) => typeof entry === "string");
    return typeof stringValue === "string" ? stringValue : undefined;
  }

  return undefined;
}

function buildPublicFileUrl(requestUrl: string, fileId: string): string {
  const origin = new URL(requestUrl).origin;
  return `${origin}/api/public/files/${fileId}`;
}

const filesRoutes = new Hono()
  .use(requireOrgAdmin())
  .post("/upload", async (c) => {
    let uploadedStorageKey: string | null = null;

    try {
      const body = await c.req.parseBody();
      const file = extractFile(body.file);
      const folder = extractString(body.folder);
      const member = c.get("member");

      if (!file) {
        throw new HTTPException(400, { message: "File is required" });
      }

      if (file.size <= 0) {
        throw new HTTPException(400, { message: "File is empty" });
      }

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        throw new HTTPException(413, {
          message: "File is too large. Max size is 5MB.",
        });
      }

      if (file.type && !file.type.startsWith("image/")) {
        throw new HTTPException(400, {
          message: "Only image uploads are supported.",
        });
      }

      const uploadedFile = await FileUploadService.uploadFile({
        file,
        folder,
        venueId: member.venueId,
      });
      uploadedStorageKey = uploadedFile.key;

      const persistedFile = await createUploadedFile({
        venueId: member.venueId,
        name: uploadedFile.name,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
        storageKey: uploadedFile.key,
      });

      return c.json(
        {
          id: persistedFile.id,
          key: persistedFile.storageKey,
          url: buildPublicFileUrl(c.req.url, persistedFile.id),
          size: persistedFile.sizeBytes,
          name: persistedFile.originalName,
          mimeType: persistedFile.mimeType,
          uploadedAt: persistedFile.createdAt,
        },
        201
      );
    } catch (error) {
      if (uploadedStorageKey) {
        await FileUploadService.deleteFile(uploadedStorageKey).catch(
          (cleanupError) => {
            console.error(
              "[FilesRoutes] Failed to cleanup orphaned upload",
              cleanupError instanceof Error
                ? cleanupError
                : new Error(String(cleanupError))
            );
          }
        );
      }

      if (error instanceof HTTPException) {
        throw error;
      }

      console.error(
        "[FilesRoutes] Failed to upload file",
        error instanceof Error ? error : new Error(String(error))
      );

      throw new HTTPException(500, { message: "Failed to upload file" });
    }
  })
  .get(
    "/:fileId/download-url",
    zValidator("param", fileIdParamSchema),
    zValidator("query", downloadUrlQuerySchema),
    async (c) => {
      try {
        const member = c.get("member");
        const { fileId } = c.req.valid("param");
        const { expiresIn } = c.req.valid("query");

        const file = await getUploadedFileByIdAndVenue(fileId, member.venueId);

        if (!file) {
          throw new HTTPException(403, {
            message: "You can only access files from your venue",
          });
        }

        const url = FileUploadService.getDownloadUrl({
          key: file.storageKey,
          expiresIn,
          requestOrigin: new URL(c.req.url).origin,
        });

        return c.json({ url });
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }

        console.error(
          "[FilesRoutes] Failed to generate download URL",
          error instanceof Error ? error : new Error(String(error))
        );

        throw new HTTPException(500, {
          message: "Failed to generate download URL",
        });
      }
    }
  )
  .delete("/:fileId", zValidator("param", fileIdParamSchema), async (c) => {
    try {
      const member = c.get("member");
      const { fileId } = c.req.valid("param");
      const file = await getUploadedFileByIdAndVenue(fileId, member.venueId);

      if (!file) {
        throw new HTTPException(403, {
          message: "You can only delete files from your venue",
        });
      }

      await FileUploadService.deleteFile(file.storageKey);
      await deleteUploadedFileByIdAndVenue(file.id, member.venueId);

      return c.json({ success: true });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error(
        "[FilesRoutes] Failed to delete file",
        error instanceof Error ? error : new Error(String(error))
      );

      throw new HTTPException(500, { message: "Failed to delete file" });
    }
  });

export { filesRoutes };
