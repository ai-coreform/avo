import { API_BASE_URL } from "@/config/environment";

interface UploadFileResponse {
  id: string;
  key: string;
  url: string;
  size: number;
  name: string;
  mimeType: string;
  uploadedAt: string;
}

class FilesApi {
  async upload(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/manage/files/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(
        (error as { message?: string })?.message || "Upload failed"
      );
    }

    return res.json();
  }

  async delete(fileId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/manage/files/${fileId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(
        (error as { message?: string })?.message || "Delete failed"
      );
    }
  }

  getPublicUrl(fileUrl: string): string {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    return `${API_BASE_URL}${fileUrl}`;
  }
}

export const filesApi = new FilesApi();
