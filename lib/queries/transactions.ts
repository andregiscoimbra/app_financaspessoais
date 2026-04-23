import type { SupabaseClient } from "@supabase/supabase-js";

import type { Categoria, Transacao } from "@/types";
import { PAGE_SIZE, type FiltrosTransacao } from "@/lib/validators/transactions";

// Placeholder até `supabase gen types` — ver lib/queries/categories.ts
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Transacao + dados da categoria embutidos (nome, cor, ícone).
 * Usado na listagem e no widget do dashboard.
 */
export interface TransacaoComCategoria extends Transacao {
  categoria: Pick<Categoria, "id" | "nome" | "cor" | "icone"> | null;
}

interface ListTransacoesResult {
  rows: TransacaoComCategoria[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listTransacoes(
  supabase: AnySupabaseClient,
  filtros: FiltrosTransacao,
): Promise<ListTransacoesResult> {
  const page = filtros.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("transactions")
    .select(
      "*, categoria:categories (id, nome, cor, icone)",
      { count: "exact" },
    )
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filtros.inicio) query = query.gte("data", filtros.inicio);
  if (filtros.fim) query = query.lte("data", filtros.fim);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  if (filtros.categorias.length > 0) query = query.in("categoria_id", filtros.categorias);
  if (filtros.meios.length > 0) query = query.in("meio_pagamento", filtros.meios);

  if (filtros.busca && filtros.busca.length > 0) {
    const term = filtros.busca.replace(/[%_,]/g, (m) => `\\${m}`);
    query = query.or(
      `descricao.ilike.%${term}%,estabelecimento.ilike.%${term}%`,
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Erro ao listar transações:", error);
    return { rows: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  return {
    rows: (data ?? []) as TransacaoComCategoria[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** Últimas N transações — usado no dashboard. */
export async function listTransacoesRecentes(
  supabase: AnySupabaseClient,
  limite = 5,
): Promise<TransacaoComCategoria[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categoria:categories (id, nome, cor, icone)")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("Erro ao listar transações recentes:", error);
    return [];
  }

  return (data ?? []) as TransacaoComCategoria[];
}

export async function getTransacao(
  supabase: AnySupabaseClient,
  id: string,
): Promise<Transacao | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar transação:", error);
    return null;
  }

  return (data as Transacao) ?? null;
}
