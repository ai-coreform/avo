"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormInput from "@/components/form/form-input";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Inserisci un indirizzo email valido")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "La password è obbligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync: signIn, isPending } = useMutation({
    mutationFn: async ({ email, password }: LoginFormValues) => {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error));
      }
    },
    onSuccess: () => {
      router.replace(getSafeRedirectPath(redirectTo));
    },
  });

  const fieldError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message;
  const rootError = form.formState.errors.root?.message;
  const errorMessage = rootError || fieldError;

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit((values) =>
          toast.promise(signIn(values), {
            loading: "Accesso in corso...",
            success: "Accesso effettuato",
            error: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Accesso fallito. Riprova.";
              form.setError("root", { message });
              return message;
            },
          })
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-bold text-2xl">Avo Admin</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Accedi alla piattaforma di amministrazione
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
            placeholder="admin@avo.com"
            spellCheck={false}
            type="email"
          />
          <FormInput
            autoComplete="current-password"
            control={form.control}
            label="Password"
            name="password"
            placeholder="Inserisci la password"
            type="password"
          />
          {errorMessage ? (
            <p className="text-center text-destructive text-sm">
              {String(errorMessage)}
            </p>
          ) : null}
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Accesso in corso..." : "Accedi"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
