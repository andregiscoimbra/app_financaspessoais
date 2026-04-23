import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransacaoComCategoria } from "@/lib/queries/transactions";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatDateBR } from "@/lib/utils/format";

interface RecentTransactionsCardProps {
  transacoes: TransacaoComCategoria[];
}

export function RecentTransactionsCard({ transacoes }: RecentTransactionsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base">Últimas transações</CardTitle>
        <Link
          href="/transacoes"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {transacoes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma transação ainda. Comece cadastrando uma em{" "}
            <Link href="/transacoes" className="font-medium text-foreground underline">
              Transações
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y">
            {transacoes.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                {t.categoria?.cor && (
                  <span
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{ backgroundColor: `${t.categoria.cor}20` }}
                  >
                    <span
                      className="flex h-full w-full items-center justify-center rounded-full"
                      style={{ color: t.categoria.cor }}
                      aria-hidden
                    >
                      •
                    </span>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateBR(t.data)}
                    {t.categoria && <> · {t.categoria.nome}</>}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    t.tipo === "receita" ? "text-success" : "text-foreground",
                  )}
                >
                  {t.tipo === "receita" ? "+" : "−"} {formatBRL(Number(t.valor))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
