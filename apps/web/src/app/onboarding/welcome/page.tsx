"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/environment";
import { authClient } from "@/lib/auth/client";

const MIN_PASSWORD_LENGTH = 8;

type PasswordStatus = "loading" | "needs_password" | "has_password";

export default function WelcomePage() {
  const router = useRouter();
  const session = authClient.useSession();
  const [passwordStatus, setPasswordStatus] =
    useState<PasswordStatus>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userName = session.data?.user?.name ?? session.data?.user?.email ?? "";

  const refreshPasswordStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/manage/me/password-status`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Impossibile verificare la password (${res.status})`);
      }
      const data = (await res.json()) as { has_password: boolean };
      setPasswordStatus(data.has_password ? "has_password" : "needs_password");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
      setPasswordStatus("has_password"); // Fail open — don't block onboarding
    }
  }, []);

  useEffect(() => {
    if (session.isPending) {
      return;
    }
    refreshPasswordStatus();
  }, [session.isPending, refreshPasswordStatus]);

  const validatePassword = (): string | null => {
    if (passwordStatus !== "needs_password") {
      return null;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.`;
    }
    if (password !== confirmPassword) {
      return "Le password non coincidono.";
    }
    return null;
  };

  async function handleContinue() {
    setError(null);

    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!tosAccepted) {
      setError("Devi accettare i Termini di Servizio per continuare.");
      return;
    }

    setSubmitting(true);
    try {
      if (passwordStatus === "needs_password") {
        const res = await fetch(
          `${API_BASE_URL}/api/manage/me/setup-password`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          }
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          throw new Error(
            body?.error?.message ??
              `Impostazione password fallita (${res.status})`
          );
        }
      }

      const tosRes = await fetch(`${API_BASE_URL}/api/manage/me/accept-tos`, {
        method: "POST",
        credentials: "include",
      });
      if (!tosRes.ok) {
        throw new Error(`Accettazione ToS fallita (${tosRes.status})`);
      }

      router.replace("/menu");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled =
    submitting ||
    !tosAccepted ||
    passwordStatus === "loading" ||
    (passwordStatus === "needs_password" &&
      (password.length < MIN_PASSWORD_LENGTH || password !== confirmPassword));

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Image
            alt="Avo"
            className="h-10 w-auto"
            height={40}
            src="/images/avo-logo.svg"
            width={120}
          />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl">
                Benvenuto{userName ? `, ${userName}` : ""} 👋
              </h1>
              <p className="text-muted-foreground">
                Il tuo locale è stato connesso ad Avo dal tuo gestionale. Il
                catalogo è già pronto. Mancano solo alcune cose.
              </p>
            </div>

            {passwordStatus === "needs_password" ? (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Imposta una password</p>
                  <p className="text-muted-foreground text-xs">
                    Ti servirà per accedere direttamente ad{" "}
                    <code>app.avomenu.com</code>. Almeno {MIN_PASSWORD_LENGTH}{" "}
                    caratteri.
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    autoComplete="new-password"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nuova password"
                    type="password"
                    value={password}
                  />
                  <input
                    autoComplete="new-password"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma password"
                    type="password"
                    value={confirmPassword}
                  />
                </div>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-accent/50">
              <input
                checked={tosAccepted}
                className="mt-1 size-4"
                onChange={(e) => setTosAccepted(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm">
                Accetto i{" "}
                <Link
                  className="underline underline-offset-2"
                  href="/legal/tos"
                  target="_blank"
                >
                  Termini di Servizio
                </Link>{" "}
                e la{" "}
                <Link
                  className="underline underline-offset-2"
                  href="/legal/privacy"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              onClick={handleContinue}
              type="button"
            >
              {submitting ? "Un attimo…" : "Vai al menù"}
            </button>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-primary lg:flex">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-48 -left-24 size-[30rem] rounded-full bg-primary-foreground/8" />
        <div className="absolute top-1/3 left-1/4 size-64 rounded-full bg-primary-foreground/5" />

        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          <Image
            alt="Avo"
            className="h-16 w-auto"
            height={64}
            src="/images/avo-logo-dark.svg"
            width={160}
          />
          <blockquote className="max-w-sm space-y-4">
            <p className="font-medium text-lg/relaxed text-white">
              Il menu digitale come non l&apos;hai mai visto prima.
              <br />
              Bello da vedere, facile da gestire.
            </p>
            <footer className="text-sm text-white/70">
              Avo — Applicazioni per la ristorazione moderna
            </footer>
          </blockquote>
        </div>
      </div>
    </main>
  );
}
