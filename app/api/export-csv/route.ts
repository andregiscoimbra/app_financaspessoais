import { format } from "date-fns";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { filtrosTransacaoSchema } from "@/lib/validators/transactions";

export const dynamic = "force-dynamic";

const LABEL_MEIOS: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
  pix: "Pix",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

const LABEL_TIPO: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

/** Limite de linhas por export — evita DoS acidental e memory blowup. */
const MAX_ROWS = 10_000;

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // 1. Autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Parse dos mesmos filtros da listagem (ignora `page` — export puxa tudo)
  const sp: Record<string, string> = {};
  for (const [k, v] of request.nextUrl.searchParams.entries()) {
    if (k !== "page") sp[k] = v;
  }
  const filtros = filtrosTransacaoSchema.parse(sp);

  // 3. Query — mesma base da listagem, sem paginação
  let query = supabase
    .from("transactions")
    .select(
      "data, tipo, valor, descricao, estabelecimento, meio_pagamento, categoria:categories (nome)",
    )
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (filtros.inicio) query = query.gte("data", filtros.inicio);
  if (filtros.fim) query = query.lte("data", filtros.fim);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  if (filtros.categorias.length > 0) query = query.in("categoria_id", filtros.categorias);
  if (filtros.meios.length > 0) query = query.in("meio_pagamento", filtros.meios);
  if (filtros.busca && filtros.busca.length > 0) {
    const term = filtros.busca.replace(/[%_,]/g, (m) => `\\${m}`);
    query = query.or(`descricao.ilike.%${term}%,estabelecimento.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro no export CSV:", error);
    return NextResponse.json({ error: "Falha ao gerar CSV." }, { status: 500 });
  }

  const rows = ((data ?? []) as unknown) as Array<{
    data: string;
    tipo: string;
    valor: number | string;
    descricao: string;
    estabelecimento: string | null;
    meio_pagamento: string | null;
    categoria: { nome: string } | null;
  }>;

  // 4. Monta CSV (UTF-8 com BOM, separador ';', decimal ',')
  const header = [
    "Data",
    "Tipo",
    "Categoria",
    "Descrição",
    "Estabelecimento",
    "Meio de Pagamento",
    "Valor",
  ];

  const lines: string[] = [header.map(escapeCsv).join(";")];

  for (const r of rows) {
    const valorNum = Number(r.valor);
    const valorStr = Number.isFinite(valorNum)
      ? valorNum.toFixed(2).replace(".", ",")
      : "";

    lines.push(
      [
        format(new Date(`${r.data}T00:00:00`), "dd/MM/yyyy"),
        LABEL_TIPO[r.tipo] ?? r.tipo,
        r.categoria?.nome ?? "",
        r.descricao,
        r.estabelecimento ?? "",
        r.meio_pagamento ? (LABEL_MEIOS[r.meio_pagamento] ?? r.meio_pagamento) : "",
        valorStr,
      ]
        .map(escapeCsv)
        .join(";"),
    );
  }

  // BOM pra garantir que Excel/Numbers detectem UTF-8
  const body = "﻿" + lines.join("\r\n");

  const filename = `transacoes-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Escapa um valor para célula CSV. Regras:
 *  - Se contém `"`, `;`, quebra de linha ou começa/termina com espaço → envolve em aspas.
 *  - Aspas internas viram `""`.
 */
function escapeCsv(value: string): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const needsQuotes =
    s.includes(";") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r") ||
    /^\s|\s$/.test(s);

  if (!needsQuotes) return s;
  return `"${s.replace(/"/g, '""')}"`;
}
