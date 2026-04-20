"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { Form } from "@avo/ui/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useInviteMember } from "@/api/team/use-invite-member";
import FormInput from "@/components/form/form-input";

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Inserisci un indirizzo email valido")
    .transform((v) => v.toLowerCase()),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const inviteMember = useInviteMember();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: InviteFormValues) {
    await inviteMember.mutateAsync({ ...values, role: "admin" });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invita membro</DialogTitle>
          <DialogDescription>
            Inserisci l&apos;email della persona da invitare al tuo locale.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              control={form.control}
              inputMode="email"
              label="Email"
              name="email"
              placeholder="email@esempio.it"
              type="email"
            />

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Annulla
              </Button>
              <Button disabled={inviteMember.isPending} type="submit">
                {inviteMember.isPending ? "Invio..." : "Invia invito"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
