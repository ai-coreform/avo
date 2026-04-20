import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@avo/ui/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@avo/ui/components/ui/popover";
import { Small } from "@avo/ui/components/ui/typography";
import { Check, ChevronDown, Loader } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/misc";

export interface FormSelectProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  control: Control<TFieldValues>;
  options: Option[];
  groupBy?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  description?: string;
  onChange?: (option?: Option | Option[] | string | string[]) => void;
  onSearch?: (search: string) => void;
  hasNextPage?: boolean;
  loading?: boolean;
  next?: () => void;
  withSearch?: boolean;
  multiselect?: boolean;
}

type Props<TFieldValues extends FieldValues> = FormSelectProps<TFieldValues>;

type FormSelectOnChange = (
  option?: Option | Option[] | string | string[]
) => void;

function resolveOption(value: string, options: Option[]): Option {
  return (
    options.find((option) => option.value === value) ?? { value, label: value }
  );
}

function normalizeCurrentMultiOptions(
  value: unknown,
  options: Option[]
): Option[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  if (typeof value[0] === "string") {
    return (value as string[]).map((item) => resolveOption(item, options));
  }

  return (value as Option[]).map((item) => {
    const candidate = options.find((option) => option.value === item.value);
    return candidate ?? item;
  });
}

function toMultiSelectPayload(
  currentValue: unknown,
  selectedOption: Option,
  options: Option[]
): Option[] | string[] {
  const currentOptions = normalizeCurrentMultiOptions(currentValue, options);
  const isSelected = currentOptions.some(
    (option) => option.value === selectedOption.value
  );

  const nextOptions = isSelected
    ? currentOptions.filter((option) => option.value !== selectedOption.value)
    : [...currentOptions, selectedOption];

  const shouldReturnStrings =
    !Array.isArray(currentValue) ||
    currentValue.length === 0 ||
    typeof currentValue[0] === "string";

  return shouldReturnStrings
    ? nextOptions.map((option) => option.value)
    : nextOptions;
}

function normalizeSingleValue(
  value: unknown,
  options: Option[]
): Option | undefined {
  if (!value) {
    return;
  }

  if (typeof value === "string") {
    return options.find((option) => option.value === value);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof value.value === "string"
  ) {
    const candidate = options.find((option) => option.value === value.value);
    return candidate ?? (value as Option);
  }

  return;
}

function toSingleSelectPayload(
  currentValue: unknown,
  selectedOption: Option
): Option | string {
  if (typeof currentValue === "string" || currentValue === undefined) {
    return selectedOption.value;
  }

  return selectedOption;
}

function handleOptionSelect(params: {
  multiselect: boolean;
  fieldValue: unknown;
  option: Option;
  options: Option[];
  onFieldChange: (value: unknown) => void;
  onChange?: FormSelectOnChange;
  onClose: () => void;
}) {
  const {
    multiselect,
    fieldValue,
    option,
    options,
    onFieldChange,
    onChange,
    onClose,
  } = params;

  if (multiselect) {
    const payload = toMultiSelectPayload(fieldValue, option, options);
    onFieldChange(payload);
    onChange?.(payload);
    return;
  }

  const payload = toSingleSelectPayload(fieldValue, option);
  onFieldChange(payload);
  onChange?.(payload);
  onClose();
}

function renderButtonContent(params: {
  multiselect: boolean;
  multiValue: Option[];
  singleValue?: Option;
  placeholder: string;
}): ReactNode {
  const { multiselect, multiValue, singleValue, placeholder } = params;

  if (multiselect) {
    if (multiValue.length === 0) {
      return placeholder;
    }

    return (
      <div className="flex h-auto flex-wrap items-center gap-1 overflow-hidden">
        {multiValue.map((selected: Option) => (
          <Badge
            className="truncate text-sm"
            key={selected.value}
            variant="secondary"
          >
            <p className="truncate">{selected.label}</p>
          </Badge>
        ))}
      </div>
    );
  }

  if (!singleValue) {
    return placeholder;
  }

  if (!singleValue.description) {
    return singleValue.label;
  }

  return (
    <span className="flex min-w-0 flex-col text-left leading-tight">
      <span className="truncate">{singleValue.label}</span>
      <span className="truncate text-muted-foreground text-xs">
        {singleValue.description}
      </span>
    </span>
  );
}

interface SelectOptionsProps {
  options: Option[];
  multiselect: boolean;
  multiValue: Option[];
  singleValue?: Option;
  onSelect: (option: Option) => void;
}

function SelectOptions({
  options,
  multiselect,
  multiValue,
  singleValue,
  onSelect,
}: SelectOptionsProps) {
  return (
    <CommandGroup className="scroll-my-1 p-0">
      {options.map((option) => {
        let isSelected = singleValue?.value === option.value;
        if (multiselect) {
          isSelected = multiValue.some(
            (selected) => selected.value === option.value
          );
        }

        return (
          <CommandItem
            className="relative w-full gap-2.5 rounded-md py-2 pr-8 pl-3"
            key={option.value}
            onSelect={() => onSelect(option)}
            value={`${option.label} ${option.description ?? ""}`}
          >
            <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
              {isSelected ? <Check className="pointer-events-none" /> : null}
            </span>
            <span className="flex min-w-0 flex-col text-left leading-tight">
              <span className="truncate">{option.label}</span>
              {option.description ? (
                <span className="truncate text-muted-foreground text-xs">
                  {option.description}
                </span>
              ) : null}
            </span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

export default function FormSelect<TFieldValues extends FieldValues>({
  name,
  description,
  label,
  control,
  options,
  onChange,
  onSearch,
  hasNextPage,
  next,
  required,
  disabled,
  loading,
  className,
  placeholder = "Select option",
  withSearch = true,
  multiselect = false,
}: Props<TFieldValues>) {
  const [open, setOpen] = useState(false);

  // Set up the intersection observer for our "load more" sentinel.
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "50px",
  });

  // When the sentinel is in view, trigger the next() function if applicable.
  useEffect(() => {
    if (inView && hasNextPage && next && !loading && open) {
      next();
    }
  }, [inView, hasNextPage, next, loading, open]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const singleValue = normalizeSingleValue(field.value, options);
        const multiValue = normalizeCurrentMultiOptions(field.value, options);

        const isEmpty = multiselect ? multiValue.length === 0 : !singleValue;
        const isInvalid = Boolean(error);
        const shouldShowSearch = Boolean(withSearch);
        const shouldShowEmptyState = options.length === 0 && !loading;
        const shouldShowSentinel =
          Boolean(next) && Boolean(hasNextPage) && !loading;

        const buttonClasses = cn(
          "h-auto min-h-9 w-full justify-between gap-1.5 rounded-md border border-input bg-input/30 px-3 py-2 font-normal text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-input/50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          Boolean(isEmpty) && "text-muted-foreground",
          Boolean(isInvalid) &&
            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive/50 dark:focus-visible:ring-destructive/40",
          className
        );

        const handleSelect = (option: Option) =>
          handleOptionSelect({
            multiselect,
            fieldValue: field.value,
            option,
            options,
            onFieldChange: field.onChange,
            onChange,
            onClose: () => setOpen(false),
          });

        return (
          <FormItem>
            <FormLabel>
              {label}
              {required ? <span className="text-red-500"> *</span> : null}
            </FormLabel>
            <Popover modal onOpenChange={setOpen} open={open}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    aria-invalid={Boolean(error)}
                    className={buttonClasses}
                    disabled={disabled}
                    variant="outline"
                  >
                    {renderButtonContent({
                      multiselect,
                      multiValue,
                      singleValue,
                      placeholder,
                    })}
                    <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="z-50 w-full min-w-(--radix-popover-trigger-width) max-w-(--radix-popover-trigger-width) gap-0 overflow-hidden rounded-md bg-popover p-0 text-popover-foreground shadow-2xl ring-1 ring-foreground/5">
                <Command className="rounded-none">
                  {shouldShowSearch ? (
                    <CommandInput
                      autoFocus={false}
                      onValueChange={onSearch}
                      placeholder="Search..."
                    />
                  ) : null}
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    {shouldShowEmptyState ? (
                      <Small className="my-4 text-center text-muted-foreground">
                        Nessun risultato
                      </Small>
                    ) : null}
                    <SelectOptions
                      multiselect={multiselect}
                      multiValue={multiValue}
                      onSelect={handleSelect}
                      options={options}
                      singleValue={singleValue}
                    />
                    {/* Loading indicator and sentinel */}
                    {loading ? (
                      <div className="p-4">
                        <Loader className="mx-auto animate-spin" size={20} />
                      </div>
                    ) : null}
                    {shouldShowSentinel ? (
                      <div className="h-4 w-full" ref={ref} />
                    ) : null}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
