"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { isValidPhoneNumber, PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS = [
  "Ricerca su Google",
  "Pubblicit\u00e0 online (es. Instagram Ads, Google Ads, etc.)",
  "Social Media (Facebook, Instagram, etc.)",
  "Passaparola",
  "Mi \u00e8 stato consigliato da un altro vostro cliente",
] as const;

type Status = "idle" | "submitting" | "success" | "error";

interface FieldErrors {
  businessName?: string;
  fullName?: string;
  phone?: string;
  province?: string;
  source?: string;
}

function validateFields(fields: {
  businessName: string;
  fullName: string;
  phone: string;
  province: string;
  source: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.businessName.trim()) {
    errors.businessName = "Inserisci il nome della tua attivita.";
  }

  if (!fields.fullName.trim()) {
    errors.fullName = "Inserisci il tuo nome e cognome.";
  } else if (!fields.fullName.trim().includes(" ")) {
    errors.fullName = "Inserisci sia il nome che il cognome.";
  }

  if (!fields.phone) {
    errors.phone = "Inserisci il tuo numero di telefono.";
  } else if (!isValidPhoneNumber(fields.phone)) {
    errors.phone =
      "Il numero di telefono non sembra valido. Controlla e riprova.";
  }

  if (!fields.province.trim()) {
    errors.province = "Inserisci la tua provincia.";
  }

  return errors;
}

function sourceOptionClass(selected: boolean, hasError: boolean): string {
  if (selected) {
    return "border-primary/30 bg-primary/5";
  }
  if (hasError) {
    return "border-destructive/30";
  }
  return "border-ink/10 hover:border-ink/20";
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p
      className="fade-in slide-in-from-top-1 mt-1.5 animate-in text-[13px] text-destructive duration-200"
      id={id}
      role="alert"
    >
      {message}
    </p>
  );
}

export default function ProvaGratisPage() {
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [source, setSource] = useState("");
  // Honeypot: real users won't fill this. The server rejects submissions where it's non-empty.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const isSubmittingRef = useRef(false);

  function clearFieldError(field: keyof FieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const errors = validateFields({
      businessName,
      fullName,
      phone,
      province,
      source,
    });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = (
        ["businessName", "fullName", "phone", "province"] as const
      ).find((f) => errors[f]);
      if (firstErrorField) {
        document
          .getElementById(firstErrorField)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    isSubmittingRef.current = true;
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          fullName,
          phone,
          province,
          source,
          website,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore sconosciuto");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Errore durante la registrazione. Riprova."
      );
    } finally {
      isSubmittingRef.current = false;
    }
  }

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    let cancelled = false;
    // Lazy-load canvas-confetti only on success so it doesn't ship in the form bundle.
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) {
        return;
      }

      const end = Date.now() + 600;
      const colors = ["#4a7c59", "#a8d5ba", "#f0c040", "#e8e8e8"];

      const frame = () => {
        if (cancelled) {
          return;
        }
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 1 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 1 },
          colors,
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "success") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-8 text-primary" />
          </div>
          <h1 className="font-bold font-display text-3xl text-ink tracking-tight">
            Registrazione completata!
          </h1>
          <p className="mt-4 text-[16px] text-ink/50 leading-relaxed">
            Grazie per la registrazione! Pensiamo a tutto noi: entro 24 ore
            riceverai il tuo menu digitale pronto all&apos;uso.
          </p>
          <Button
            asChild
            className="mt-8 h-11 rounded-full px-8 font-display font-semibold"
          >
            <Link href="/">Torna alla home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-white">
      <div className="mx-auto max-w-lg px-6 py-10 md:py-16">
        {/* Back link */}
        <Link
          className="mb-10 inline-flex items-center gap-1.5 text-[14px] text-ink/40 transition-colors hover:text-ink"
          href="/"
        >
          <ArrowLeft className="size-3.5" />
          Torna alla home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <Image
            alt="Avo"
            className="mb-8 h-8 w-auto"
            height={32}
            priority
            src="/images/avo-logo.svg"
            width={80}
          />
          <h1 className="font-bold font-display text-[clamp(1.8rem,4vw,2.5rem)] text-ink leading-tight tracking-tight">
            Ricevi il tuo menu digitale
          </h1>
          <p className="mt-3 text-[16px] text-ink/45 leading-relaxed">
            Compila il form con le tue informazioni e ricevi il tuo menu
            digitale entro 24 ore.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
          {/* Honeypot — visually hidden, ignored by humans, filled by bots. */}
          <div
            aria-hidden="true"
            className="absolute top-auto -left-[10000px] h-px w-px overflow-hidden"
          >
            <label htmlFor="website">Sito web (non compilare)</label>
            <input
              autoComplete="off"
              id="website"
              name="website"
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              type="text"
              value={website}
            />
          </div>

          <div className="space-y-2">
            <Label
              className="font-semibold text-[17px] text-ink"
              htmlFor="businessName"
            >
              Nome dell&apos;attivita{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-describedby={
                fieldErrors.businessName ? "businessName-error" : undefined
              }
              aria-invalid={!!fieldErrors.businessName}
              className={cn(
                "h-11 rounded-lg text-[15px]",
                fieldErrors.businessName && "border-destructive"
              )}
              id="businessName"
              onChange={(e) => {
                setBusinessName(e.target.value);
                clearFieldError("businessName");
              }}
              placeholder="Es. Ristorante Da Mario"
              value={businessName}
            />
            <FieldError
              id="businessName-error"
              message={fieldErrors.businessName}
            />
          </div>

          <div className="space-y-2">
            <Label
              className="font-semibold text-[17px] text-ink"
              htmlFor="fullName"
            >
              Nome e Cognome <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-describedby={
                fieldErrors.fullName ? "fullName-error" : undefined
              }
              aria-invalid={!!fieldErrors.fullName}
              className={cn(
                "h-11 rounded-lg text-[15px]",
                fieldErrors.fullName && "border-destructive"
              )}
              id="fullName"
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("fullName");
              }}
              placeholder="Es. Mario Rossi"
              value={fullName}
            />
            <FieldError id="fullName-error" message={fieldErrors.fullName} />
          </div>

          <div className="space-y-2">
            <Label
              className="font-semibold text-[17px] text-ink"
              htmlFor="phone"
            >
              Numero di Telefono <span className="text-destructive">*</span>
            </Label>
            <p className="text-[13px] text-ink/35" id="phone-hint">
              Idealmente il tuo numero{" "}
              <span className="font-semibold">WhatsApp</span>
            </p>
            <PhoneInput
              aria-describedby={cn(
                "phone-hint",
                fieldErrors.phone && "phone-error"
              )}
              aria-invalid={!!fieldErrors.phone}
              className={cn(
                "[&_button]:h-11 [&_input]:h-11 [&_input]:rounded-e-lg [&_input]:text-[15px]",
                fieldErrors.phone &&
                  "[&_button]:border-destructive [&_input]:border-destructive"
              )}
              onChange={(value) => {
                setPhone(value || "");
                clearFieldError("phone");
              }}
              placeholder="333 1234567"
              // biome-ignore lint/suspicious/noExplicitAny: PhoneInput's Value type is a branded string; cast avoids a needless import.
              value={phone as any}
            />
            <FieldError id="phone-error" message={fieldErrors.phone} />
          </div>

          <div className="space-y-2">
            <Label
              className="font-semibold text-[17px] text-ink"
              htmlFor="province"
            >
              Provincia <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-describedby={
                fieldErrors.province ? "province-error" : undefined
              }
              aria-invalid={!!fieldErrors.province}
              className={cn(
                "h-11 rounded-lg text-[15px]",
                fieldErrors.province && "border-destructive"
              )}
              id="province"
              onChange={(e) => {
                setProvince(e.target.value);
                clearFieldError("province");
              }}
              placeholder="Es. Milano"
              value={province}
            />
            <FieldError id="province-error" message={fieldErrors.province} />
          </div>

          <fieldset className="space-y-3">
            <legend className="font-semibold text-[17px] text-ink">
              Come hai scoperto Avo?
            </legend>
            {SOURCE_OPTIONS.map((option) => (
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                  sourceOptionClass(
                    source === option,
                    Boolean(fieldErrors.source)
                  )
                )}
                key={option}
              >
                <input
                  checked={source === option}
                  className="size-4 accent-primary"
                  name="source"
                  onChange={(e) => {
                    setSource(e.target.value);
                    clearFieldError("source");
                  }}
                  type="radio"
                  value={option}
                />
                <span className="text-[14px] text-ink">{option}</span>
              </label>
            ))}
            <FieldError message={fieldErrors.source} />
          </fieldset>

          <p className="text-[13px] text-ink/35 leading-relaxed">
            Inviando questo modulo, accetti la nostra{" "}
            <a
              className="underline underline-offset-2 hover:text-ink/50"
              href="/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>
            .
          </p>

          {status === "error" && (
            <p className="text-[14px] text-destructive">{errorMsg}</p>
          )}

          <Button
            className="mt-2 h-12 w-full rounded-full font-display font-semibold text-[15px]"
            disabled={status === "submitting"}
            type="submit"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                Invia
                <ArrowRight className="ml-1.5 size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
