import { z } from "zod";

import { TIPOS_TRANSACAO } from "@/lib/validators/transactions";

const cor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "Cor inválida (use hex #RRGGBB).")
  .optional()
  .or(z.literal("").transform(() => undefined));

const icone = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const categoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(40, "Nome muito longo."),
  tipo: z.enum(TIPOS_TRANSACAO, { required_error: "Selecione o tipo." }),
  cor,
  icone,
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
