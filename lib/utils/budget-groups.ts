import { CATEGORIAS_DESEJOS, CATEGORIAS_NECESSIDADES, type Grupo5030 } from "@/types";

/**
 * Agrupa uma categoria (pelo nome) em necessidades/desejos segundo a regra 50/30/20.
 * Categorias não listadas caem em "desejos" por padrão (conservador — prefere
 * tratar como "querer" do que "precisar").
 * A fatia "poupança" (20%) não é modelada como categoria — é derivada de receitas − despesas.
 */
export function classificar5030(nome: string): Grupo5030 {
  if ((CATEGORIAS_NECESSIDADES as readonly string[]).includes(nome)) {
    return "necessidades";
  }
  if ((CATEGORIAS_DESEJOS as readonly string[]).includes(nome)) {
    return "desejos";
  }
  return "desejos";
}

export const REFERENCIA_5030 = {
  necessidades: 0.5,
  desejos: 0.3,
  poupanca: 0.2,
} as const;

export const LABELS_5030: Record<Grupo5030, string> = {
  necessidades: "Necessidades",
  desejos: "Desejos",
  poupanca: "Poupança",
};
