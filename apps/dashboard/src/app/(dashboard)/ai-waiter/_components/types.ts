import { z } from "zod";
import {
  DEFAULT_PERSONALITY,
  type PersonalitySlug,
} from "./personality-presets";

export const DEFAULT_BG_COLOR = "#1A1A1A";

export const DEFAULT_WELCOME_QUESTIONS = [
  "Cosa mi consigli per un aperitivo?",
  "Quale vino sta bene con la carne?",
  "Quali sono le promo del momento?",
  "Voglio qualcosa di fresco e leggero",
] as const;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const personalitySchema = z.enum([
  "natural",
  "casual",
  "formal",
  "bistro",
  "sommelier",
  "bartender",
] as const satisfies readonly PersonalitySlug[]);

export const aiWaiterFormSchema = z.object({
  bgColor: z.string().regex(HEX_RE, "Inserisci un colore valido (#RRGGBB)"),
  questions: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Il suggerimento non può essere vuoto")
        .max(90, "Massimo 90 caratteri")
    )
    .length(4),
  personality: personalitySchema,
});

export type AiWaiterFormValues = z.infer<typeof aiWaiterFormSchema>;

export const DEFAULT_FORM_VALUES: AiWaiterFormValues = {
  bgColor: DEFAULT_BG_COLOR,
  questions: [...DEFAULT_WELCOME_QUESTIONS],
  personality: DEFAULT_PERSONALITY,
};
