import { Avatar, AvatarFallback } from "@avo/ui/components/ui/avatar";
import { cn } from "@avo/ui/lib/utils";
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
} from "react";

type AvatarProps = ComponentProps<typeof Avatar>;

interface AvatarGroupProps extends ComponentProps<"div"> {
  children: ReactElement<AvatarProps>[];
  max?: number;
}

const AvatarGroup = ({
  children,
  max,
  className,
  ...props
}: AvatarGroupProps) => {
  const totalAvatars = Children.count(children);
  const displayedAvatars = Children.toArray(children).slice(0, max).reverse();
  const remainingAvatars = max ? Math.max(totalAvatars - max, 1) : 0;

  return (
    <div
      className={cn("flex flex-row-reverse items-center", className)}
      {...props}
    >
      {remainingAvatars > 0 && (
        <Avatar className="relative -ml-2 ring-2 ring-background hover:z-10">
          <AvatarFallback className="bg-muted-foreground text-white">
            +{remainingAvatars}
          </AvatarFallback>
        </Avatar>
      )}
      {displayedAvatars.map((avatar, index) => {
        if (!isValidElement(avatar)) {
          return null;
        }

        return (
          <div className="relative -ml-2 hover:z-10" key={index.toString()}>
            {cloneElement(avatar as ReactElement<AvatarProps>, {
              className: "ring-2 ring-background",
            })}
          </div>
        );
      })}
    </div>
  );
};

export { AvatarGroup };
