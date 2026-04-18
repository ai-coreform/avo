import { authClient } from "@/lib/auth/client";

export async function handleLogout() {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error("Error during sign out:", error);
  } finally {
    window.location.href = "/login";
  }
}
