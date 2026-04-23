import type { SupabaseClient } from "@supabase/supabase-js";

import type { Orcamento } from "@/types";

type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Retorna a meta **vigente** de cada categoria do usuário.
 * "Vigente" = `vigente_ate IS NULL OR vigente_ate >= hoje`.
 *
 * Uma categoria pode ter várias linhas (histórico). Pegamos a mais recente
 * dessas vigentes por `vigente_desde` desc.
 */
export async function listBudgetsVigentes(
  supabase: AnySupabaseClient,
): Promise<Orcamento[]> {
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .or(`vigente_ate.is.null,vigente_ate.gte.${hoje}`)
    .lte("vigente_desde", hoje)
    .order("vigente_desde", { ascending: false });

  if (error) {
    console.error("Erro ao listar budgets:", error);
    return [];
  }

  // Uma categoria pode ter múltiplas vigentes (overlap). Mantemos só a mais
  // recente por categoria — o front não precisa saber do histórico.
  const vigentePorCategoria = new Map<string, Orcamento>();
  for (const row of (data ?? []) as Orcamento[]) {
    if (!vigentePorCategoria.has(row.categoria_id)) {
      vigentePorCategoria.set(row.categoria_id, row);
    }
  }

  return [...vigentePorCategoria.values()];
}
