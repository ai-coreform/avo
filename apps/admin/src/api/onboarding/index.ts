import { API_BASE_URL } from "@/config/environment";
import { client } from "@/lib/api";

export async function checkSlug(slug: string) {
  const res = await client.api.admin.onboarding["check-slug"].$get({
    query: { slug },
  });
  return await res.json();
}

export async function startImport(formData: FormData) {
  const res = await fetch(`${API_BASE_URL}/api/platform/onboarding/import`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      (data as { message?: string })?.message ?? "Failed to start import";
    throw new Error(message);
  }

  return (await res.json()) as {
    jobId: string;
    status: string;
  };
}

export interface ImportJobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string | null;
  totalSteps: number;
  completedSteps: number;
  errorMessage: string | null;
  venueId: string | null;
  venueSlug: string | null;
  result: {
    categoryCount: number;
    groupCount: number;
    itemCount: number;
  } | null;
}

export async function getImportStatus(jobId: string): Promise<ImportJobStatus> {
  const res = await client.api.admin.onboarding.import[":jobId"].status.$get({
    param: { jobId },
  });
  return (await res.json()) as ImportJobStatus;
}
