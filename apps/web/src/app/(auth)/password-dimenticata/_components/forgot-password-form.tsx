"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormInput from "@/components/form/form-input";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Inserisci un indirizzo email valido")
    .transform((value) => value.toLowerCase()),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  className?: string;
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { mutateAsync: request, isPending } = useMutation({
    mutationFn: async ({ email }: ForgotPasswordFormValues) => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reimposta-password",
      });
      if (result.error) {
        throw new Error(
          result.error.message ??
            "Non siamo riusciti a inviare l'email. Riprova."
        );
      }
    },
    onSuccess: () => {
      setSent(true);
    },
  });

  if (sent) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-2xl">Controlla la tua email</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Se esiste un account con questa email, ti abbiamo inviato un link
            per reimpostare la password. Il link scade tra 1 ora.
          </p>
        </div>
        <div className="text-sm">
          Non hai ricevuto nulla?{" "}
          <button
            className="underline underline-offset-4 hover:text-primary"
            onClick={() => setSent(false)}
            type="button"
          >
            Riprova
          </button>
        </div>
        <div className="text-sm">
          <Link
            className="underline underline-offset-4 hover:text-primary"
            href="/accedi"
          >
            Torna ad accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit((values) =>
          toast.promise(request(values), {
            loading: "Invio in corso...",
            success: "Se l'email esiste, il link è stato inviato.",
            error: (error) =>
              error instanceof Error
                ? error.message
                : "Non siamo riusciti a inviare l'email. Riprova.",
          })
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-bold text-2xl">Password dimenticata?</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Inserisci la tua email e ti invieremo un link per reimpostare la
            password.
          </p>
        </div>

        <div className="grid gap-6">
          <FormInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            control={form.control}
            inputMode="email"
            label="Email"
            name="email"
            placeholder="mail@esempio.it"
            spellCheck={false}
            type="email"
          />
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Invio..." : "Invia link"}
          </Button>
        </div>

        <div className="text-center text-sm">
          <Link
            className="underline underline-offset-4 hover:text-primary"
            href="/accedi"
          >
            Torna ad accedi
          </Link>
        </div>
      </form>
    </Form>
  );
}
