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

const grupoMeta = z
  .enum(["necessidades", "desejos"], {
    invalid_type_error: "Grupo inválido.",
  })
  .optional()
  .or(z.literal("").transform(() => undefined));

export const categoriaSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório.")
      .max(40, "Nome muito longo."),
    tipo: z.enum(TIPOS_TRANSACAO, { required_error: "Selecione o tipo." }),
    cor,
    icone,
    grupo_meta: grupoMeta,
  })
  .superRefine((val, ctx) => {
    // Despesa exige escolha de grupo (necessidade/desejo).
    if (val.tipo === "despesa" && !val.grupo_meta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["grupo_meta"],
        message: "Escolha o grupo (Necessidade ou Desejo).",
      });
    }
  });

export type CategoriaInput = z.infer<typeof categoriaSchema>;
