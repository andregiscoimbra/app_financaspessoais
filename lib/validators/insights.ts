import { z } from "zod";

/**
 * Schema de um insight gerado pela IA. Mantém intencionalmente simples:
 * 1 emoji, 1 título, 1 descrição. Usado tanto para validar a resposta do
 * Claude quanto para tipar o cache no Supabase.
 */
export const insightSchema = z.object({
  emoji: z.string().min(1).max(4),
  titulo: z.string().trim().min(1).max(80),
  descricao: z.string().trim().min(1).max(200),
});

export const insightsArraySchema = z.array(insightSchema).min(1).max(6);

export type InsightValidated = z.infer<typeof insightSchema>;
