"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import { ChevronDown, Phone } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import PhoneNumberInput, {
  type Country,
  type FlagProps,
  getCountryCallingCode,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { cn } from "@/lib/utils";

export interface FormPhoneInputProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label?: string;
  control: Control<TFieldValues>;
  required?: boolean;
  defaultCountry?: Country;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
}

type Props<TFieldValues extends FieldValues> =
  FormPhoneInputProps<TFieldValues>;

export default function FormPhoneInput<TFieldValues extends FieldValues>({
  name,
  label,
  control,
  required,
  defaultCountry = "IT",
  disabled,
  description,
  placeholder = "Inserisci numero di telefono",
}: Props<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? (
            <FormLabel>
              {label}
              {required ? <span className="text-red-500"> *</span> : null}
            </FormLabel>
          ) : null}
          <FormControl>
            <div dir="ltr">
              <PhoneNumberInput
                className="group/phone relative flex h-9 w-full rounded-md border border-input bg-input/30 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50"
                countrySelectComponent={CountrySelect}
                defaultCountry={defaultCountry}
                disabled={disabled}
                flagComponent={FlagComponent}
                id={name}
                inputComponent={PhoneInput}
                international
                onChange={(newValue) => field.onChange(newValue ?? "")}
                placeholder={placeholder}
                value={field.value}
              />
            </div>
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const PhoneInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <Input
      className={cn(
        "h-full rounded-s-none rounded-e-md border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

PhoneInput.displayName = "PhoneInput";

interface CountrySelectProps {
  disabled?: boolean;
  value: Country;
  onChange: (value: Country) => void;
  options: { label: string; value: Country | undefined }[];
}

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as Country);
  };

  return (
    <div className="relative inline-flex h-full items-center rounded-s-md border-input border-e bg-background/70 py-2 ps-3 pe-2 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground">
      <div aria-hidden="true" className="inline-flex items-center gap-1">
        <FlagComponent aria-hidden="true" country={value} countryName={value} />
        <span className="text-muted-foreground/80">
          <ChevronDown aria-hidden="true" size={16} strokeWidth={2} />
        </span>
      </div>
      <select
        aria-label="Select country"
        className="absolute inset-0 text-sm opacity-0"
        disabled={disabled}
        onChange={handleSelect}
        value={value}
      >
        <option key="default" value="">
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option key={option.value ?? `empty-${i}`} value={option.value}>
              {option.label}{" "}
              {option.value ? `+${getCountryCallingCode(option.value)}` : null}
            </option>
          ))}
      </select>
    </div>
  );
};

const FlagComponent = ({ country, countryName }: FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <Phone aria-hidden="true" size={16} />
      )}
    </span>
  );
};
