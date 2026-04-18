import { Button } from "@avo/ui/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import { X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

export type FormInputProps<TFieldValues extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> & {
    name: FieldPath<TFieldValues>;
    label?: string;
    control: Control<TFieldValues>;
    required?: boolean;
    description?: string;
    deletable?: boolean;
    onDelete?: () => void;
  };

type Props<TFieldValues extends FieldValues> = FormInputProps<TFieldValues>;

export default function FormInput<TFieldValues extends FieldValues>({
  name,
  label,
  control,
  required,
  description,
  onDelete,
  ...props
}: Props<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const { value, onChange, onBlur, ref } = field;

        return (
          <FormItem>
            {label ? (
              <FormLabel>
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
              </FormLabel>
            ) : null}
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  onBlur={onBlur}
                  onChange={onChange}
                  ref={ref}
                  value={value ?? ""}
                  {...props}
                  id={props.id ?? field.name}
                  name={field.name}
                />
                {onDelete ? (
                  <Button onClick={onDelete} size="icon" variant="secondary">
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </FormControl>
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
