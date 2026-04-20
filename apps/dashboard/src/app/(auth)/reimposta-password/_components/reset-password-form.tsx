"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormInput from "@/components/form/form-input";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.`
      ),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Le password non coincidono.",
    path: ["confirm"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  className?: string;
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const { mutateAsync: submit, isPending } = useMutation({
    mutationFn: async ({ password }: ResetPasswordFormValues) => {
      if (!token) {
        throw new Error(
          "Link non valido. Richiedi un nuovo link dalla pagina 'Password dimenticata'."
        );
      }
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) {
        throw new Error(
          result.error.message ??
            "Non siamo riusciti a reimpostare la password. Il link potrebbe essere scaduto."
        );
      }
    },
    onSuccess: () => {
      setDone(true);
    },
  });

  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-2xl">Link non valido</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Questo link di reimpostazione non è valido. Richiedine uno nuovo.
          </p>
        </div>
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="/password-dimenticata"
        >
          Richiedi nuovo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-2xl">Password aggiornata</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Puoi ora accedere con la tua nuova password.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push("/accedi")}>
          Vai ad accedi
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit((values) =>
          toast.promise(submit(values), {
            loading: "Aggiornamento in corso...",
            success: "Password aggiornata",
            error: (error) =>
              error instanceof Error
                ? error.message
                : "Non siamo riusciti a reimpostare la password.",
          })
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-bold text-2xl">Reimposta la password</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Scegli una nuova password per il tuo account.
          </p>
        </div>

        <div className="grid gap-6">
          <FormInput
            autoComplete="new-password"
            control={form.control}
            label="Nuova password"
            name="password"
            placeholder="********"
            type="password"
          />
          <FormInput
            autoComplete="new-password"
            control={form.control}
            label="Conferma password"
            name="confirm"
            placeholder="********"
            type="password"
          />
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Aggiornamento..." : "Aggiorna password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
