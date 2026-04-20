import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link className="flex items-center gap-2 font-medium" href="/menu">
            <Image
              alt="Avo"
              className="h-10 w-auto"
              height={40}
              src="/images/avo-logo.svg"
              width={120}
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
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
              Avo - Applicazioni per la ristorazione moderna
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
