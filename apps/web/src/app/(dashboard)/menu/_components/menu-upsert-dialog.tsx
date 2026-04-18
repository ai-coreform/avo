"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@avo/ui/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  getMenuStatusClassName,
  getMenuStatusLabel,
  menuStatusValues,
} from "@/api/menu/data";
import type { MenuListItem, MenuStatus } from "@/api/menu/types";
import { useCreateMenu } from "@/api/menu/use-create-menu";
import { useUpdateMenu } from "@/api/menu/use-update-menu";
import FormInput from "@/components/form/form-input";
import { cn } from "@/lib/utils";
import {
  type MenuFormValues,
  menuFormSchema,
} from "../_utils/menu-form-schema";

interface MenuUpsertDialogProps {
  menu?: MenuListItem;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function submitButtonLabel(isPending: boolean, isEditing: boolean): string {
  if (isPending) {
    return isEditing ? "Salvataggio..." : "Creazione...";
  }
  return isEditing ? "Salva modifiche" : "Crea menu";
}

function getDefaultValues(menu?: MenuListItem): MenuFormValues {
  return {
    name: menu?.name ?? "",
    status: (menu?.status as MenuFormValues["status"]) ?? undefined,
  };
}

export function MenuUpsertDialog({
  menu,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: MenuUpsertDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const defaultValues = useMemo(() => getDefaultValues(menu), [menu]);
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const isEditing = Boolean(menu);
  const isPending = createMenu.isPending || updateMenu.isPending;
  const rootError = form.formState.errors.root?.message
    ? String(form.formState.errors.root.message)
    : "";

  async function onSubmit(values: MenuFormValues) {
    if (menu) {
      await updateMenu.mutateAsync({
        menuSlug: menu.slug,
        data: values,
      });
      setOpen(false);
      form.reset(defaultValues);
      return;
    }

    const createdMenu = await createMenu.mutateAsync(values);

    router.push(`/menu/${createdMenu.data.slug}`);
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          form.reset(defaultValues);
        }
      }}
      open={open}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifica menu" : "Crea un nuovo menu"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica il nome o lo stato del menu."
              : "Scegli il nome del menu. Potrai aggiungere portate e categorie in seguito."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) =>
              toast.promise(onSubmit(values), {
                loading: isEditing
                  ? "Aggiornamento menu in corso..."
                  : "Creazione menu in corso...",
                success: isEditing
                  ? "Menu aggiornato correttamente"
                  : "Menu creato correttamente",
                error: (error) => {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Non siamo riusciti a salvare il menu. Riprova.";

                  form.setError("root", { message });
                  return message;
                },
              })
            )}
          >
            <div className="grid gap-4">
              <FormInput
                autoComplete="off"
                control={form.control}
                label="Nome"
                name="name"
                placeholder="Menu pranzo"
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stato</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {menuStatusValues.map((status) => {
                          const isActive = field.value === status;
                          return (
                            <button
                              className={cn(
                                "rounded-full border px-3 py-1 font-medium text-xs transition-all",
                                isActive
                                  ? cn(
                                      "ring-2 ring-offset-1 ring-offset-background",
                                      statusRingColor(status),
                                      getMenuStatusClassName(status)
                                    )
                                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                              )}
                              key={status}
                              onClick={() => field.onChange(status)}
                              type="button"
                            >
                              {getMenuStatusLabel(status)}
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            {rootError ? (
              <p className="text-destructive text-sm">{rootError}</p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isPending} type="button" variant="outline">
                  Annulla
                </Button>
              </DialogClose>
              <Button disabled={isPending} type="submit">
                {submitButtonLabel(isPending, isEditing)}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function statusRingColor(status: MenuStatus): string {
  switch (status) {
    case "published":
      return "ring-emerald-400 dark:ring-emerald-500";
    case "draft":
      return "ring-amber-400 dark:ring-amber-500";
    case "archived":
      return "ring-zinc-400 dark:ring-zinc-500";
    default:
      return "ring-border";
  }
}
