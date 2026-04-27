import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/app/(auth)/registrati/_components/sign-up-form";

export const metadata: Metadata = { title: "Registrati" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
