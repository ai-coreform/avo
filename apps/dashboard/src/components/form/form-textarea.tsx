import { Button } from "@avo/ui/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Textarea } from "@avo/ui/components/ui/textarea";
import { X } from "lucide-react";
import type { TextareaHTMLAttributes } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

export type FormTextAreaProps<TFieldValues extends FieldValues> =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    name: FieldPath<TFieldValues>;
    label?: string;
    control: Control<TFieldValues>;
    required?: boolean;
    description?: string;
    deletable?: boolean;
    onDelete?: () => void;
  };

type Props<TFieldValues extends FieldValues> = FormTextAreaProps<TFieldValues>;

export default function FormTextArea<TFieldValues extends FieldValues>({
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
                <Textarea
                  onBlur={onBlur}
                  onChange={onChange}
                  ref={ref}
                  value={value ?? ""}
                  {...props}
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
