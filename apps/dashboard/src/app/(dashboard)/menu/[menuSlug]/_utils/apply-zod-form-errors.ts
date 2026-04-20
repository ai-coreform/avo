import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodError } from "zod";

export function applyZodFormErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: ZodError
) {
  form.clearErrors();

  for (const issue of error.issues) {
    const path = issue.path.join(".");

    if (!path) {
      continue;
    }

    form.setError(path as FieldPath<TFieldValues>, {
      type: "manual",
      message: issue.message,
    });
  }
}
