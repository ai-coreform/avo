import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@avo/ui/components/ui/avatar";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import type { User } from "@/types/misc";

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: User | undefined;
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user,
}: UserAvatarProfileProps) {
  if (!user) {
    return <Skeleton className="h-8 w-full rounded-lg" />;
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar className={className}>
        <AvatarImage alt={user.name} src={user.image ?? undefined} />
        <AvatarFallback className="rounded-lg">
          {user.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>

      {showInfo ? (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{user.name}</span>
          <span className="truncate text-xs">{user.email}</span>
        </div>
      ) : null}
    </div>
  );
}
