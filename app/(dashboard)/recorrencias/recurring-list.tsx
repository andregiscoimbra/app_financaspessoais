import { Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatDateBR } from "@/lib/utils/format";
import type { RecorrenciaComCategoria } from "@/lib/queries/recurring-transactions";
import type { Categoria } from "@/types";

import { RecurringRowActions } from "./recurring-row-actions";

const LABEL_MEIOS: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
  pix: "Pix",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

interface RecurringListProps {
  recorrencias: RecorrenciaComCategoria[];
  categorias: Categoria[];
}

export function RecurringList({ recorrencias, categorias }: RecurringListProps) {
  if (recorrencias.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="Nenhuma recorrência cadastrada"
        description="Cadastre as transações que se repetem todo mês (IPTU, condomínio, celular, salário)."
      />
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <ul className="divide-y">
        {recorrencias.map((r) => {
          const Icon = getCategoryIcon(r.categoria?.icone);
          const cor = r.categoria?.cor ?? "#6b7280";

          return (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-3 p-4 transition-opacity",
                !r.ativa && "opacity-50",
              )}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${cor}20`, color: cor }}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{r.descricao}</p>
                  {!r.ativa && (
                    <Badge variant="outline" className="font-normal">
                      Pausada
                    </Badge>
                  )}
                  {r.tipo === "receita" ? (
                    <Badge variant="success" className="font-normal">
                      Receita
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Todo dia {r.dia_do_mes}</span>
                  {r.categoria && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{r.categoria.nome}</span>
                    </>
                  )}
                  {r.meio_pagamento && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{LABEL_MEIOS[r.meio_pagamento]}</span>
                    </>
                  )}
                  <span aria-hidden>·</span>
                  <span>
                    desde {formatDateBR(r.vigente_desde)}
                    {r.vigente_ate && ` até ${formatDateBR(r.vigente_ate)}`}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "text-right text-sm font-semibold tabular-nums",
                  r.tipo === "receita" ? "text-success" : "text-foreground",
                )}
              >
                {r.tipo === "receita" ? "+" : "−"} {formatBRL(Number(r.valor))}
              </div>

              <RecurringRowActions recorrencia={r} categorias={categorias} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
