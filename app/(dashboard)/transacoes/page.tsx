import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { listCategorias } from "@/lib/queries/categories";
import { listTransacoes } from "@/lib/queries/transactions";
import { createClient } from "@/lib/supabase/server";
import { filtrosTransacaoSchema } from "@/lib/validators/transactions";
import { formatBRL } from "@/lib/utils/format";

import { ExportButton } from "./export-button";
import { Pagination } from "./pagination";
import { TransactionFilters } from "./transaction-filters";
import { TransactionTable } from "./transaction-table";

export const metadata = { title: "Transações · Finanças Pessoais" };

// Searchparams são dinâmicos — precisa forçar render a cada requisição
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function TransacoesPage({ searchParams }: PageProps) {
  const supabase = createClient();

  // Normaliza searchParams (arrays → primeiros valores)
  const sp: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") sp[k] = v;
    else if (Array.isArray(v) && v[0]) sp[k] = v[0];
  }

  const filtros = filtrosTransacaoSchema.parse(sp);

  const [categorias, resultado] = await Promise.all([
    listCategorias(supabase),
    listTransacoes(supabase, filtros),
  ]);

  // Totais do resultado filtrado (somente da página atual — para totais globais,
  // precisaríamos de uma query separada; deixado para a Fase 4 / dashboard)
  const totalReceitas = resultado.rows
    .filter((r) => r.tipo === "receita")
    .reduce((acc, r) => acc + Number(r.valor), 0);
  const totalDespesas = resultado.rows
    .filter((r) => r.tipo === "despesa")
    .reduce((acc, r) => acc + Number(r.valor), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">
            {resultado.total === 0
              ? "Nenhuma transação cadastrada ainda."
              : `${resultado.total} ${resultado.total === 1 ? "transação" : "transações"} no total.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton total={resultado.total} />
          <TransactionDialog categorias={categorias} />
        </div>
      </div>

      <TransactionFilters categorias={categorias} />

      {resultado.rows.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-md border bg-card px-3 py-1.5">
            <span className="text-muted-foreground">Receitas (página): </span>
            <span className="font-medium text-success">{formatBRL(totalReceitas)}</span>
          </div>
          <div className="rounded-md border bg-card px-3 py-1.5">
            <span className="text-muted-foreground">Despesas (página): </span>
            <span className="font-medium text-foreground">{formatBRL(totalDespesas)}</span>
          </div>
        </div>
      )}

      <TransactionTable transacoes={resultado.rows} categorias={categorias} />

      <Pagination
        page={resultado.page}
        pageSize={resultado.pageSize}
        total={resultado.total}
      />
    </div>
  );
}
