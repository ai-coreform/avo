import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { API_BASE_URL } from "@/config/environment";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [adminClient()],
});

export type AuthClient = typeof authClient;
export type AuthSession = typeof authClient.$Infer.Session;
export type AuthUser = AuthSession["user"];
