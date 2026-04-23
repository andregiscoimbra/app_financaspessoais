import { Receipt, Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import type { TransacaoComCategoria } from "@/lib/queries/transactions";
import { formatBRL, formatDateBR } from "@/lib/utils/format";
import type { Categoria } from "@/types";

import { TransactionRowActions } from "./transaction-row-actions";

const LABEL_MEIOS: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
  pix: "Pix",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

interface TransactionTableProps {
  transacoes: TransacaoComCategoria[];
  categorias: Categoria[];
}

export function TransactionTable({ transacoes, categorias }: TransactionTableProps) {
  if (transacoes.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma transação encontrada"
        description="Ajuste os filtros ou cadastre uma nova transação."
      />
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Tabela (desktop / tablet) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Meio</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[44px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoes.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground">
                  {formatDateBR(t.data)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-medium">
                      {t.descricao}
                      {t.recorrencia_id && (
                        <Repeat
                          className="h-3 w-3 shrink-0 text-muted-foreground"
                          aria-label="Gerada por recorrência"
                        />
                      )}
                    </span>
                    {t.estabelecimento && (
                      <span className="text-xs text-muted-foreground">
                        {t.estabelecimento}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {t.categoria ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 font-normal"
                      style={
                        t.categoria.cor
                          ? {
                              borderColor: `${t.categoria.cor}40`,
                              backgroundColor: `${t.categoria.cor}14`,
                            }
                          : undefined
                      }
                    >
                      {t.categoria.cor && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.categoria.cor }}
                        />
                      )}
                      {t.categoria.nome}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.meio_pagamento ? LABEL_MEIOS[t.meio_pagamento] : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums",
                    t.tipo === "receita" ? "text-success" : "text-foreground",
                  )}
                >
                  {t.tipo === "receita" ? "+" : "−"} {formatBRL(Number(t.valor))}
                </TableCell>
                <TableCell>
                  <TransactionRowActions transacao={t} categorias={categorias} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cards (mobile) */}
      <ul className="divide-y md:hidden">
        {transacoes.map((t) => (
          <li key={t.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium">{t.descricao}</p>
                {t.recorrencia_id && (
                  <Repeat
                    className="h-3 w-3 shrink-0 text-muted-foreground"
                    aria-label="Gerada por recorrência"
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatDateBR(t.data)}</span>
                {t.categoria && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="flex items-center gap-1">
                      {t.categoria.cor && (
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: t.categoria.cor }}
                        />
                      )}
                      {t.categoria.nome}
                    </span>
                  </>
                )}
                {t.meio_pagamento && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{LABEL_MEIOS[t.meio_pagamento]}</span>
                  </>
                )}
              </div>
            </div>
            <div
              className={cn(
                "text-right text-sm font-semibold tabular-nums",
                t.tipo === "receita" ? "text-success" : "text-foreground",
              )}
            >
              {t.tipo === "receita" ? "+" : "−"} {formatBRL(Number(t.valor))}
            </div>
            <TransactionRowActions transacao={t} categorias={categorias} />
          </li>
        ))}
      </ul>
    </div>
  );
}
