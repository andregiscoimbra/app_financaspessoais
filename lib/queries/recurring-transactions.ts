import type { SupabaseClient } from "@supabase/supabase-js";

import type { Categoria, TransacaoRecorrente } from "@/types";

type AnySupabaseClient = SupabaseClient<any, any, any>;

export interface RecorrenciaComCategoria extends TransacaoRecorrente {
  categoria: Pick<Categoria, "id" | "nome" | "cor" | "icone"> | null;
}

export async function listRecorrencias(
  supabase: AnySupabaseClient,
): Promise<RecorrenciaComCategoria[]> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, categoria:categories (id, nome, cor, icone)")
    .order("ativa", { ascending: false })
    .order("dia_do_mes")
    .order("descricao");

  if (error) {
    console.error("Erro ao listar recorrências:", error);
    return [];
  }

  return (data ?? []) as RecorrenciaComCategoria[];
}
