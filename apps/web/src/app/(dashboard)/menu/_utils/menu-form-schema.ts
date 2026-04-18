import { z } from "zod";

export const menuFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Inserisci il nome del menu")
    .max(120, "Il nome non puo superare 120 caratteri"),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export type MenuFormValues = z.infer<typeof menuFormSchema>;
