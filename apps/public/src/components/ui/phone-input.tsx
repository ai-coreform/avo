"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@avo/ui/components/ui/command";
import { Input } from "@avo/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@avo/ui/components/ui/popover";
import { ScrollArea } from "@avo/ui/components/ui/scroll-area";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
// biome-ignore lint/performance/noNamespaceImport: React namespace needed for forwardRef/ComponentProps types.
import * as React from "react";
// biome-ignore lint/performance/noNamespaceImport: RPNInput.default is the component entry — namespace import is required.
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import it from "react-phone-number-input/locale/it";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> & {
  value?: RPNInput.Value;
  onChange?: (value: RPNInput.Value) => void;
};

const PhoneInput = React.forwardRef<
  React.ComponentRef<typeof RPNInput.default>,
  PhoneInputProps
>(({ className, onChange, value, ...props }, ref) => {
  return (
    <RPNInput.default
      className={cn("flex", className)}
      countrySelectComponent={CountrySelect}
      defaultCountry="IT"
      flagComponent={FlagComponent}
      inputComponent={InputComponent}
      labels={it}
      onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
      ref={ref}
      smartCaret={false}
      value={value || undefined}
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn("rounded-s-none rounded-e-lg", className)}
    {...props}
    ref={ref}
  />
));
InputComponent.displayName = "InputComponent";

interface CountryEntry {
  label: string;
  value: RPNInput.Country | undefined;
}

interface CountrySelectProps {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
}

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover
      modal
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
      open={isOpen}
    >
      <PopoverTrigger asChild>
        <Button
          className="flex gap-1 rounded-s-lg rounded-e-none border-r-0 px-3 focus:z-10"
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <span className="text-foreground/70 text-sm">
            +{RPNInput.getCountryCallingCode(selectedCountry)}
          </span>
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            onValueChange={(value) => {
              setSearchValue(value);
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    "[data-radix-scroll-area-viewport]"
                  );
                  if (viewportElement) {
                    viewportElement.scrollTop = 0;
                  }
                }
              }, 0);
            }}
            placeholder="Cerca paese..."
            value={searchValue}
          />
          <CommandList>
            <ScrollArea className="h-72" ref={scrollAreaRef}>
              <CommandEmpty>Nessun paese trovato.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CommandItem
                      className="gap-2"
                      key={value}
                      onSelect={() => {
                        onChange(value);
                        setIsOpen(false);
                      }}
                    >
                      <FlagComponent country={value} countryName={label} />
                      <span className="flex-1 text-sm">{label}</span>
                      <span className="text-foreground/50 text-sm">
                        {`+${RPNInput.getCountryCallingCode(value)}`}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          value === selectedCountry
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
// biome-ignore lint/performance/noBarrelFile: consumers import both the component and the validator from one module.
export { isValidPhoneNumber } from "react-phone-number-input";
