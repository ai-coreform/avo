import { and, eq } from "drizzle-orm";
import database from "@/db";
import { uploadedFile } from "@/db/schema/uploaded-file";

export function getUploadedFileById(fileId: string) {
  return database.query.uploadedFile.findFirst({
    where: eq(uploadedFile.id, fileId),
  });
}

export function getUploadedFileByIdAndVenue(fileId: string, venueId: string) {
  return database.query.uploadedFile.findFirst({
    where: and(eq(uploadedFile.id, fileId), eq(uploadedFile.venueId, venueId)),
  });
}

export async function createUploadedFile(input: {
  venueId: string;
  name: string;
  size: number;
  mimeType: string;
  storageKey: string;
}) {
  const [file] = await database
    .insert(uploadedFile)
    .values({
      venueId: input.venueId,
      originalName: input.name,
      sizeBytes: input.size,
      mimeType: input.mimeType,
      storageKey: input.storageKey,
    })
    .returning();

  return file;
}

export async function deleteUploadedFileByIdAndVenue(
  fileId: string,
  venueId: string
) {
  const [file] = await database
    .delete(uploadedFile)
    .where(and(eq(uploadedFile.id, fileId), eq(uploadedFile.venueId, venueId)))
    .returning();

  return file ?? null;
}
