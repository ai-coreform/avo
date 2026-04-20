import type { authClient } from "@/lib/auth/client";

export interface Option {
  label: string;
  value: string;
  description?: string;
}

export type SessionData = NonNullable<
  Awaited<ReturnType<typeof authClient.useSession>>["data"]
>;

export type User = SessionData["user"];
