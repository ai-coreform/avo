import { Checkbox } from "@avo/ui/components/ui/checkbox";
import type { ComponentProps, ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

type CheckboxProps = ComponentProps<typeof Checkbox>;
type CheckedState = Parameters<
  NonNullable<CheckboxProps["onCheckedChange"]>
>[0];

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";

export type FormCheckboxProps<TFieldValues extends FieldValues> =
  CheckboxProps & {
    name: FieldPath<TFieldValues>;
    label?: string;
    control: Control<TFieldValues>;
    description?: string;
    endIcon?: ReactNode;
    onCheckChange?: (checked: CheckedState) => void;
  };

type Props<TFieldValues extends FieldValues> = FormCheckboxProps<TFieldValues>;

export default function FormCheckbox<TFieldValues extends FieldValues>({
  name,
  label,
  control,
  description,
  endIcon,
  onCheckChange,
  ...props
}: Props<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                defaultChecked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onCheckChange?.(checked);
                }}
                {...props}
              />
            </FormControl>
            {label ? <FormLabel>{label}</FormLabel> : null}
            {endIcon}
            <FormMessage />
          </FormItem>
          {description ? (
            <FormDescription
              aria-live="polite"
              className="mt-2 text-muted-foreground text-xs"
            >
              {description}
            </FormDescription>
          ) : null}
        </div>
      )}
    />
  );
}
