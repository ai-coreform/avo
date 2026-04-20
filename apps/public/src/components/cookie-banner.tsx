"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "avo-cookie-consent";

type Consent = "granted" | "denied";

export function getConsent(): Consent | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(CONSENT_KEY) as Consent | null;
}

function setConsent(value: Consent) {
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event("cookie-consent"));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) {
      setVisible(true);
    }
  }, []);

  function accept() {
    setConsent("granted");
    setVisible(false);
  }

  function decline() {
    setConsent("denied");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-ink/8 bg-white px-5 py-4 shadow-lg sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-ink/70 text-sm">
          Utilizziamo cookie per migliorare la tua esperienza e analizzare il
          traffico.{" "}
          <Link
            className="underline underline-offset-2 hover:text-ink"
            href="/cookie-policy"
          >
            Cookie policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            className="rounded-full border border-ink/15 px-4 py-1.5 font-medium text-ink/60 text-sm transition-colors hover:border-ink/30 hover:text-ink"
            onClick={decline}
            type="button"
          >
            Rifiuta
          </button>
          <button
            className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
            onClick={accept}
            type="button"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
