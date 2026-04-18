"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormInput from "@/components/form/form-input";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Inserisci un indirizzo email valido")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "La password deve contenere almeno 8 caratteri"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface SignInFormProps {
  className?: string;
}

export function SignInForm({ className }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");
  const prefillEmail = searchParams.get("email") ?? "";
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: prefillEmail,
      password: "",
    },
  });

  const {
    formState: { errors },
  } = form;

  const { mutateAsync: signIn, isPending } = useMutation({
    mutationFn: async ({ email, password }: SignInFormValues) => {
      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error));
      }
    },
    onSuccess: () => {
      router.replace(redirectTo ?? "/menu");
    },
    onError: undefined,
  });

  const fieldError =
    errors.email?.message || errors.password?.message
      ? String(errors.email?.message || errors.password?.message)
      : "";
  const rootError = form.formState.errors.root?.message
    ? String(form.formState.errors.root.message)
    : "";
  const errorMessage = rootError || fieldError;

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit((values) =>
          toast.promise(signIn(values), {
            loading: "Accesso in corso...",
            success: "Accesso completato",
            error: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Non siamo riusciti ad accedere. Riprova.";
              form.setError("root", { message });
              return message;
            },
          })
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-bold text-2xl">Accedi al tuo account</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Inserisci la tua email per accedere
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
          <FormInput
            autoComplete="current-password"
            control={form.control}
            label="Password"
            name="password"
            placeholder="********"
            type="password"
          />
          <div className="-mt-2 text-right">
            <Link
              className="text-sm underline underline-offset-4 hover:text-primary"
              href="/password-dimenticata"
            >
              Password dimenticata?
            </Link>
          </div>
          {errorMessage ? (
            <p className="text-center text-destructive text-sm">
              {errorMessage}
            </p>
          ) : null}
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Accesso..." : "Accedi"}
          </Button>
        </div>
        <div className="text-center text-sm">
          Non hai un account?{" "}
          <Link
            className="underline underline-offset-4 hover:text-primary"
            href={
              redirectTo
                ? `/registrati?redirect_to=${encodeURIComponent(redirectTo)}`
                : "/registrati"
            }
          >
            Registrati
          </Link>
        </div>
      </form>
    </Form>
  );
}
