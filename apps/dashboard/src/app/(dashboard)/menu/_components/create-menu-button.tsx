import { Button } from "@avo/ui/components/ui/button";
import { Plus } from "lucide-react";
import { MenuUpsertDialog } from "./menu-upsert-dialog";

interface CreateMenuButtonProps {
  children: React.ReactNode;
  buttonProps?: Omit<React.ComponentProps<typeof Button>, "children">;
}

export function CreateMenuButton({
  children,
  buttonProps,
}: CreateMenuButtonProps) {
  return (
    <MenuUpsertDialog
      trigger={
        <Button {...buttonProps}>
          <Plus />
          {children}
        </Button>
      }
    />
  );
}
