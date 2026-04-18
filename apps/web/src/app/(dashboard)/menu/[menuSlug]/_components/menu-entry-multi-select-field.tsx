"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@avo/ui/components/ui/popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

interface MenuEntryMultiSelectOption {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface MenuEntryMultiSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  options: MenuEntryMultiSelectOption[];
  themeColor: string;
  iconCircle?: boolean;
}

function getThemeStyles(color: string) {
  return {
    pillBg: `${color}15`,
    pillText: color,
    pillBorder: `${color}30`,
  };
}

function renderOptionIcon(
  option: MenuEntryMultiSelectOption,
  themeColor: string,
  iconCircle: boolean | undefined,
  size: "sm" | "md"
) {
  const Icon = option.icon;

  if (!Icon) {
    return null;
  }

  if (iconCircle) {
    const circleClass =
      size === "sm" ? "h-3.5 w-3.5 rounded-full" : "h-5 w-5 rounded-full";
    const iconClass = size === "sm" ? "h-2 w-2" : "h-3 w-3";

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center text-white",
          circleClass
        )}
        style={{ backgroundColor: themeColor }}
      >
        <Icon className={iconClass} />
      </span>
    );
  }

  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span style={{ color: themeColor }}>
      <Icon className={cn("shrink-0", iconClass)} />
    </span>
  );
}

function renderTriggerContent(params: {
  selectedOptions: MenuEntryMultiSelectOption[];
  placeholder: string;
  themeColor: string;
  iconCircle?: boolean;
  onClear: () => void;
}): ReactNode {
  const { selectedOptions, placeholder, themeColor, iconCircle, onClear } =
    params;

  if (selectedOptions.length === 0) {
    return <span className="text-muted-foreground text-sm">{placeholder}</span>;
  }

  const theme = getThemeStyles(themeColor);

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
      {selectedOptions.length <= 3 ? (
        selectedOptions.map((option) => (
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-[11px] leading-tight"
            key={option.id}
            style={{
              backgroundColor: theme.pillBg,
              color: theme.pillText,
              border: `1px solid ${theme.pillBorder}`,
            }}
          >
            {renderOptionIcon(option, themeColor, iconCircle, "sm")}
            <span className="max-w-[80px] truncate">{option.label}</span>
          </span>
        ))
      ) : (
        <span
          className="inline-flex items-center rounded px-2 py-0.5 font-medium text-[11px]"
          style={{
            backgroundColor: theme.pillBg,
            color: theme.pillText,
            border: `1px solid ${theme.pillBorder}`,
          }}
        >
          {selectedOptions.length} selezionat
          {selectedOptions.length === 1 ? "o" : "i"}
        </span>
      )}
      <button
        className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        tabIndex={-1}
        type="button"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function MenuEntryMultiSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  themeColor,
  iconCircle,
}: MenuEntryMultiSelectFieldProps<TFieldValues>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return options;
    }

    const query = search.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearch("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = Array.isArray(field.value)
          ? (field.value as string[])
          : [];
        const selectedOptions = options.filter((option) =>
          value.includes(option.id)
        );

        function toggle(optionId: string) {
          const nextValue = value.includes(optionId)
            ? value.filter((selectedId) => selectedId !== optionId)
            : [...value, optionId];

          field.onChange(nextValue);
        }

        return (
          <FormItem>
            <FormLabel className="font-sans text-muted-foreground text-xs">
              {label}
            </FormLabel>
            <Popover onOpenChange={setOpen} open={open}>
              <PopoverTrigger asChild>
                <FormControl>
                  <button
                    className="flex min-h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-1.5 text-left outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                    type="button"
                  >
                    {renderTriggerContent({
                      selectedOptions,
                      placeholder,
                      themeColor,
                      iconCircle,
                      onClear: () => {
                        field.onChange([]);
                      },
                    })}
                    <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="z-[100] w-[var(--radix-popover-trigger-width)] gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 shadow-black/8 shadow-lg"
                onOpenAutoFocus={(event) => event.preventDefault()}
                side="bottom"
                sideOffset={4}
              >
                <div className="border-muted border-b p-1.5">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-8 border-border bg-muted pl-7 text-sm shadow-none focus-visible:ring-0"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Cerca..."
                      ref={searchRef}
                      value={search}
                    />
                  </div>
                </div>

                <div
                  className="max-h-60 overflow-y-auto overscroll-contain py-1"
                  onTouchMove={(event) => event.stopPropagation()}
                  onWheel={(event) => event.stopPropagation()}
                >
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-2 text-muted-foreground text-sm italic">
                      Nessun risultato
                    </div>
                  ) : (
                    filteredOptions.map((option) => {
                      const isSelected = value.includes(option.id);

                      return (
                        <button
                          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-muted"
                          key={option.id}
                          onClick={() => toggle(option.id)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                              isSelected
                                ? "text-white"
                                : "border-border bg-card"
                            )}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: themeColor,
                                    borderColor: themeColor,
                                  }
                                : undefined
                            }
                          >
                            {isSelected ? <Check className="h-3 w-3" /> : null}
                          </span>
                          {renderOptionIcon(
                            option,
                            themeColor,
                            iconCircle,
                            "md"
                          )}
                          <span className="truncate text-foreground text-sm">
                            {option.label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
