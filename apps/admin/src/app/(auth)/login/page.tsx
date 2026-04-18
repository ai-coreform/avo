"use client";

import { AuthGuestGuard } from "@/components/auth/auth-guest-guard";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <AuthGuestGuard redirectPath="/">
      <LoginForm />
    </AuthGuestGuard>
  );
}
