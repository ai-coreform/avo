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
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@avo/ui/components/ui/select";
import { Switch } from "@avo/ui/components/ui/switch";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useUpdateMember } from "@/api/venues/use-update-member";

interface MemberData {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isActive: boolean;
}

interface EditMemberDialogProps {
  venueId: string;
  member: MemberData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberDialog({
  venueId,
  member,
  open,
  onOpenChange,
}: EditMemberDialogProps) {
  const mutation = useUpdateMember(venueId);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "member" as string,
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: member.userName ?? "",
        email: member.userEmail ?? "",
        phoneNumber: "",
        role: member.role ?? "member",
        isActive: member.isActive,
      });
    }
  }, [open, member]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const data: Record<string, unknown> = {
      name: form.name || undefined,
      email: form.email || undefined,
      phoneNumber: form.phoneNumber || null,
      role: form.role,
      isActive: form.isActive,
    };

    mutation.mutate(
      { userId: member.userId, data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica membro</DialogTitle>
          <DialogDescription>
            Aggiorna le informazioni utente e le impostazioni di appartenenza.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="memberName">Nome</Label>
            <Input
              id="memberName"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              value={form.name}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memberEmail">Email</Label>
            <Input
              id="memberEmail"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              type="email"
              value={form.email}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memberPhone">Numero di telefono</Label>
            <Input
              id="memberPhone"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
              }
              value={form.phoneNumber}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memberRole">Ruolo</Label>
            <Select
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, role: value }))
              }
              value={form.role}
            >
              <SelectTrigger id="memberRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="cursor-pointer" htmlFor="memberActive">
              Attivo
            </Label>
            <Switch
              checked={form.isActive}
              id="memberActive"
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          {mutation.isError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
              {mutation.error.message}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Annulla
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva modifiche"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
