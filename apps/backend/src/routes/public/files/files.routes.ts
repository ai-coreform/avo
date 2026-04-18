import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { FileUploadService } from "@/lib/file-upload";
import { getUploadedFileById } from "@/routes/manage/files/files.service";

const fileIdParamSchema = z.object({
  fileId: z.string().uuid(),
});

const publicFilesRoutes = new Hono()
  .get(
    "/local",
    async (c) => await FileUploadService.getLocalDownloadResponse(c.req.raw)
  )
  .get("/:fileId", zValidator("param", fileIdParamSchema), async (c) => {
    try {
      const { fileId } = c.req.valid("param");
      const file = await getUploadedFileById(fileId);

      if (!file) {
        throw new HTTPException(404, { message: "File not found" });
      }

      if (FileUploadService.isLocalStorageMode()) {
        return await FileUploadService.getLocalFileResponse(file.storageKey);
      }

      const url = FileUploadService.getDownloadUrl({
        key: file.storageKey,
        expiresIn: 60,
        requestOrigin: new URL(c.req.url).origin,
      });

      return Response.redirect(url, 302);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error(
        "[PublicFilesRoutes] Failed to serve file",
        error instanceof Error ? error : new Error(String(error))
      );

      throw new HTTPException(500, { message: "Failed to serve file" });
    }
  });

export { publicFilesRoutes };
