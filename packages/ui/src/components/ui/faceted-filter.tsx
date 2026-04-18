import { cn } from "@avo/ui/lib/utils";
import { Check } from "lucide-react";
import type * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const FacetedFilter = Popover;

const FacetedFilterTrigger = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverTrigger> & {
  ref?: React.RefObject<React.ComponentRef<typeof PopoverTrigger> | null>;
}) => (
  <PopoverTrigger className={cn(className)} ref={ref} {...props}>
    {children}
  </PopoverTrigger>
);
FacetedFilterTrigger.displayName = "FacetedFilterTrigger";

const FacetedFilterContent = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverContent> & {
  ref?: React.RefObject<React.ComponentRef<typeof PopoverContent> | null>;
}) => (
  <PopoverContent
    align="start"
    className={cn("w-[12.5rem] p-0", className)}
    ref={ref}
    {...props}
  >
    <Command>{children}</Command>
  </PopoverContent>
);
FacetedFilterContent.displayName = "FacetedFilterContent";

const FacetedFilterInput = CommandInput;

const FacetedFilterList = CommandList;

const FacetedFilterEmpty = CommandEmpty;

const FacetedFilterGroup = CommandGroup;

interface FacetedFilterItemProps
  extends React.ComponentPropsWithoutRef<typeof CommandItem> {
  selected: boolean;
}

const FacetedFilterItem = ({
  className,
  children,
  selected,
  ref,
  ...props
}: FacetedFilterItemProps & {
  ref?: React.RefObject<React.ComponentRef<typeof CommandItem> | null>;
}) => (
  <CommandItem
    aria-selected={selected}
    className={cn(className)}
    data-selected={selected}
    ref={ref}
    {...props}
  >
    <span
      className={cn(
        "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
        selected
          ? "bg-primary text-primary-foreground"
          : "opacity-50 [&_svg]:invisible"
      )}
    >
      <Check className="size-4" />
    </span>
    {children}
  </CommandItem>
);
FacetedFilterItem.displayName = "FacetedFilterItem";

const FacetedFilterSeparator = CommandSeparator;

const FacetedFilterShortcut = CommandShortcut;

export {
  FacetedFilter,
  FacetedFilterTrigger,
  FacetedFilterContent,
  FacetedFilterInput,
  FacetedFilterList,
  FacetedFilterEmpty,
  FacetedFilterGroup,
  FacetedFilterItem,
  FacetedFilterSeparator,
  FacetedFilterShortcut,
};
