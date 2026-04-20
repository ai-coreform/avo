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
import FormPhoneInput from "@/components/form/form-phone-input";
import { client } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import {
  normalizePhoneNumber,
  PHONE_NUMBER_PLACEHOLDER,
} from "@/lib/auth/phone";
import { cn } from "@/lib/utils";

function createSignUpSchema(requireVenueName: boolean) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, "Inserisci il nome completo dell'utente")
      .max(120, "Il nome non puo superare 120 caratteri"),
    venueName: requireVenueName
      ? z
          .string()
          .trim()
          .min(2, "Inserisci il nome del locale")
          .max(120, "Il nome del locale non puo superare 120 caratteri")
      : z.string().optional(),
    email: z
      .string()
      .trim()
      .email("Inserisci un indirizzo email valido")
      .transform((value) => value.toLowerCase()),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Inserisci un numero di telefono")
      .transform((value, ctx) => {
        const normalizedPhoneNumber = normalizePhoneNumber(value);

        if (!normalizedPhoneNumber) {
          ctx.addIssue({
            code: "custom",
            message:
              "Inserisci un numero di telefono valido in formato internazionale",
          });
          return z.NEVER;
        }

        return normalizedPhoneNumber;
      }),
    password: z
      .string()
      .min(8, "La password deve contenere almeno 8 caratteri")
      .max(128, "La password e troppo lunga"),
  });
}

type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>;

interface SignUpFormProps {
  className?: string;
}

async function generateVenueSlug(venueName: string): Promise<string> {
  const res = await client.api.public.venue["generate-slug"].$post({
    json: { name: venueName },
  });
  const { data } = await res.json();
  return data.slug;
}

export function SignUpForm({ className }: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");
  const prefillEmail = searchParams.get("email") ?? "";
  const isInvitedSignUp = redirectTo?.startsWith("/inviti");
  const signUpSchema = createSignUpSchema(!isInvitedSignUp);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: prefillEmail,
      phoneNumber: "",
      password: "",
      ...(isInvitedSignUp ? {} : { venueName: "" }),
    },
  });

  const { mutateAsync: signUp, isPending } = useMutation({
    mutationFn: async ({
      email,
      name,
      password,
      phoneNumber,
      venueName,
    }: SignUpFormValues) => {
      const result = await authClient.signUp.email({
        email,
        name,
        password,
        phoneNumber,
      });
      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error));
      }
      // Skip venue creation for invited users — they'll join via invitation
      if (result.data.user && venueName && !isInvitedSignUp) {
        const slug = await generateVenueSlug(venueName);
        await authClient.organization.create({
          name: venueName,
          slug,
          userId: result.data.user.id,
        });
      }
    },
    onSuccess: () => {
      router.replace(redirectTo ?? "/menu");
    },
    onError: undefined,
  });

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit((values) =>
          toast.promise(signUp(values), {
            loading: "Registrazione in corso...",
            success: "Account creato correttamente",
            error: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Non siamo riusciti a registrare l'account. Riprova.";
              form.setError("root", { message });
              return message;
            },
          })
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-bold text-2xl">
            {isInvitedSignUp
              ? "Crea il tuo account per accettare l'invito"
              : "Crea il tuo account"}
          </h1>
          <p className="text-balance text-muted-foreground text-sm">
            Inserisci i dati per creare il tuo account
          </p>
        </div>
        <div className="grid gap-6">
          {isInvitedSignUp ? null : (
            <FormInput
              autoCapitalize="words"
              autoComplete="name"
              control={form.control}
              label="Nome del locale"
              name="venueName"
              placeholder="Elisir Cocktail Bar"
              type="text"
            />
          )}
          <FormInput
            autoCapitalize="words"
            autoComplete="name"
            control={form.control}
            label="Nome"
            name="name"
            placeholder="Mario Rossi"
            type="text"
          />
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
          <FormPhoneInput
            control={form.control}
            defaultCountry="IT"
            label="Telefono"
            name="phoneNumber"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
          />
          <FormInput
            autoComplete="new-password"
            control={form.control}
            label="Password"
            name="password"
            placeholder="********"
            type="password"
          />
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Creazione..." : "Crea Account"}
          </Button>
        </div>
        <div className="text-center text-sm">
          Hai gia un account?{" "}
          <Link
            className="underline underline-offset-4 hover:text-primary"
            href={
              redirectTo
                ? `/accedi?redirect_to=${encodeURIComponent(redirectTo)}`
                : "/accedi"
            }
          >
            Accedi
          </Link>
        </div>
      </form>
    </Form>
  );
}
