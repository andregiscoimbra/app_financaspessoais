import type { SupabaseClient } from "@supabase/supabase-js";

import type { Categoria, TipoTransacao } from "@/types";

// Aceita qualquer shape de Database — nosso `types/database.ts` é placeholder
// até rodarmos `supabase gen types`. A tipagem das linhas vem dos casts internos.
type AnySupabaseClient = SupabaseClient<any, any, any>;

export async function listCategorias(
  supabase: AnySupabaseClient,
  options: { tipo?: TipoTransacao; incluirInativas?: boolean } = {},
): Promise<Categoria[]> {
  let query = supabase.from("categories").select("*").order("nome");

  if (!options.incluirInativas) {
    query = query.eq("ativa", true);
  }

  if (options.tipo) {
    query = query.eq("tipo", options.tipo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar categorias:", error);
    return [];
  }

  return (data ?? []) as Categoria[];
}
