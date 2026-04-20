import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = { title: "Reimposta password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
