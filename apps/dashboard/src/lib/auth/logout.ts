import { authClient } from "@/lib/auth/client";

/**
 * Utility function to handle logout that can be called from anywhere
 * (not just from React hooks). This is used for automatic logout on 401 errors.
 */
export async function handleLogout() {
  try {
    await authClient.signOut();
  } catch (error) {
    // Even if signOut fails, we should still clear the auth state
    console.error("Error during sign out:", error);
  } finally {
    // Use window.location for redirect since we're outside route context
    window.location.href = "/accedi";
  }
}
