import { Button } from "@avo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import { Loader2, LogOut } from "lucide-react";
import { Activity } from "react";
import useSignOut from "@/hooks/use-sign-out";
import type { User } from "@/types/misc";
import { UserAvatarProfile } from "../user-avatar-profile";

interface UserNavProps {
  user: User | undefined;
}

export function UserNav({ user }: UserNavProps) {
  const { signOut, loading } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8 rounded-full" variant="ghost">
          <UserAvatarProfile user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuItem onClick={signOut}>
          <Activity mode={loading ? "visible" : "hidden"}>
            <Loader2 className="size-4 animate-spin" />
          </Activity>
          <Activity mode={loading ? "hidden" : "visible"}>
            <LogOut className="size-4 text-destructive" />
          </Activity>
          <span className="text-destructive">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
