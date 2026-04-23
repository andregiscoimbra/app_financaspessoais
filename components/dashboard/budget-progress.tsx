import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatPercent } from "@/lib/utils/format";

interface BudgetProgressProps {
  gastoTotal: number;
  metaTotal: number;
}

export function BudgetProgress({ gastoTotal, metaTotal }: BudgetProgressProps) {
  if (metaTotal === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Orçamento do mês</p>
            <p className="text-xs text-muted-foreground">
              Defina metas em <strong>Metas</strong> para acompanhar o uso do orçamento.
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatBRL(gastoTotal)}</p>
        </CardContent>
      </Card>
    );
  }

  const ratio = gastoTotal / metaTotal;
  const ultrapassou = ratio > 1;
  const atencao = ratio > 0.8 && !ultrapassou;

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">Orçamento do mês</p>
          <p className="text-sm tabular-nums">
            <span
              className={cn(
                "font-semibold",
                ultrapassou && "text-destructive",
                atencao && "text-warning-foreground",
              )}
            >
              {formatBRL(gastoTotal)}
            </span>{" "}
            <span className="text-muted-foreground">/ {formatBRL(metaTotal)}</span>
          </p>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              ultrapassou
                ? "bg-destructive"
                : atencao
                  ? "bg-warning"
                  : "bg-success",
            )}
            style={{ width: `${Math.min(ratio, 1) * 100}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {ultrapassou
            ? `Ultrapassou o orçamento em ${formatPercent(ratio - 1)}.`
            : `${formatPercent(ratio)} do orçamento consumido.`}
        </p>
      </CardContent>
    </Card>
  );
}
