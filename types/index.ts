/**
 * Tipos de domínio compartilhados entre camadas.
 * Espelham as colunas das tabelas definidas em supabase/migrations/.
 */

export type TipoTransacao = "receita" | "despesa";

export type MeioPagamento = "debito" | "credito" | "pix" | "dinheiro" | "outro";

export type GrupoMeta = "necessidades" | "desejos";

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoTransacao;
  icone: string | null;
  cor: string | null;
  ativa: boolean;
  grupo_meta: GrupoMeta | null;
  created_at: string;
  updated_at: string;
}

export interface Transacao {
  id: string;
  user_id: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  estabelecimento: string | null;
  descricao: string;
  categoria_id: string;
  meio_pagamento: MeioPagamento | null;
  recorrencia_id: string | null;
  parcela_atual: number | null;
  parcela_total: number | null;
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  user_id: string;
  categoria_id: string;
  valor_mensal: number;
  vigente_desde: string;
  vigente_ate: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransacaoRecorrente {
  id: string;
  user_id: string;
  tipo: TipoTransacao;
  valor: number;
  descricao: string;
  estabelecimento: string | null;
  categoria_id: string;
  meio_pagamento: MeioPagamento | null;
  dia_do_mes: number;
  vigente_desde: string;
  vigente_ate: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsightIA {
  emoji: string;
  titulo: string;
  descricao: string;
}

/**
 * Agrupamento 50/30/20 usado no dashboard.
 * Referência: PRD §5.4.
 */
export type Grupo5030 = "necessidades" | "desejos" | "poupanca";

export const CATEGORIAS_NECESSIDADES = [
  "Casa",
  "Alimentação",
  "Celular",
  "Combustível",
  "Higiene pessoal",
  "Produtos de limpeza",
  "Saúde",
  "Transporte trabalho",
  "Educação",
] as const;

export const CATEGORIAS_DESEJOS = [
  "Beleza",
  "Lazer",
  "Roupas",
  "Eletrônicos",
  "Academia",
  "Presente",
  "Transporte geral",
  "Social/Igreja",
] as const;
