"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import { RotateCcw } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";
import {
  DEFAULT_WELCOME_QUESTIONS,
  type AiWaiterFormValues,
} from "./types";

interface QuestionsSectionProps {
  control: Control<AiWaiterFormValues>;
  setValue: UseFormSetValue<AiWaiterFormValues>;
}

export function QuestionsSection({
  control,
  setValue,
}: QuestionsSectionProps) {
  const questions = useWatch({ control, name: "questions" });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-lg">
            Domande di benvenuto
          </h3>
          <p className="text-muted-foreground text-sm">
            Quattro suggerimenti che il cliente vede appena apre la chat. Pensa
            a domande che valorizzino il tuo locale.
          </p>
        </div>
        <Button
          className="shrink-0 text-muted-foreground"
          onClick={() =>
            setValue("questions", [...DEFAULT_WELCOME_QUESTIONS], {
              shouldDirty: true,
            })
          }
          size="sm"
          type="button"
          variant="ghost"
        >
          <RotateCcw className="size-3.5" />
          Ripristina tutte
        </Button>
      </div>

      <div className="space-y-3">
        {DEFAULT_WELCOME_QUESTIONS.map((defaultValue, idx) => {
          const current = questions?.[idx] ?? "";
          const isDefault = current.trim() === defaultValue;

          return (
            <FormField
              control={control}
              key={defaultValue}
              name={`questions.${idx}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs"
                      >
                        {idx + 1}
                      </span>
                      <Input
                        {...field}
                        className="rounded-full"
                        maxLength={90}
                        placeholder={defaultValue}
                      />
                      <Button
                        aria-label={`Ripristina suggerimento ${idx + 1}`}
                        className="shrink-0 text-muted-foreground"
                        disabled={isDefault}
                        onClick={() =>
                          setValue(`questions.${idx}` as const, defaultValue, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
