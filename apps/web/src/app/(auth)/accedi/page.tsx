import type { Metadata } from "next";
import { SignInForm } from "@/app/(auth)/accedi/_components/sign-in-form";

export const metadata: Metadata = { title: "Accedi" };

export default function LoginPage() {
  return <SignInForm />;
}
