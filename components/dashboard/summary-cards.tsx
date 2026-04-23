import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatPercent } from "@/lib/utils/format";

interface SummaryCardsProps {
  totaisMes: { receitas: number; despesas: number };
  totaisMesAnterior: { receitas: number; despesas: number };
}

export function SummaryCards({ totaisMes, totaisMesAnterior }: SummaryCardsProps) {
  const saldo = totaisMes.receitas - totaisMes.despesas;
  const saldoAnterior = totaisMesAnterior.receitas - totaisMesAnterior.despesas;
  const taxaPoupanca = totaisMes.receitas > 0 ? saldo / totaisMes.receitas : 0;
  const taxaPoupancaAnterior =
    totaisMesAnterior.receitas > 0
      ? saldoAnterior / totaisMesAnterior.receitas
      : 0;

  const cards: Array<{
    label: string;
    valor: string;
    delta: number | null;
    /**
     * Para receitas, aumento é bom (verde). Para despesas, aumento é ruim
     * (vermelho). Para saldo e taxa poupança, aumento é bom.
     */
    direcaoPositiva: "up" | "down";
    destaque?: "success" | "destructive";
  }> = [
    {
      label: "Receitas",
      valor: formatBRL(totaisMes.receitas),
      delta: deltaPct(totaisMes.receitas, totaisMesAnterior.receitas),
      direcaoPositiva: "up",
      destaque: "success",
    },
    {
      label: "Despesas",
      valor: formatBRL(totaisMes.despesas),
      delta: deltaPct(totaisMes.despesas, totaisMesAnterior.despesas),
      direcaoPositiva: "down",
    },
    {
      label: "Saldo",
      valor: formatBRL(saldo),
      delta: deltaPct(saldo, saldoAnterior),
      direcaoPositiva: "up",
      destaque: saldo >= 0 ? "success" : "destructive",
    },
    {
      label: "Taxa de poupança",
      valor: formatPercent(taxaPoupanca),
      delta:
        totaisMesAnterior.receitas > 0
          ? taxaPoupanca - taxaPoupancaAnterior
          : null,
      direcaoPositiva: "up",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                c.destaque === "success" && "text-success",
                c.destaque === "destructive" && "text-destructive",
              )}
            >
              {c.valor}
            </p>
            <DeltaLabel
              delta={c.delta}
              direcaoPositiva={c.direcaoPositiva}
              asPercent={c.label !== "Taxa de poupança"}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function DeltaLabel({
  delta,
  direcaoPositiva,
  asPercent,
}: {
  delta: number | null;
  direcaoPositiva: "up" | "down";
  asPercent: boolean;
}) {
  if (delta === null) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        sem dados no mês anterior
      </p>
    );
  }

  const isUp = delta > 0.0005;
  const isDown = delta < -0.0005;
  const isFlat = !isUp && !isDown;

  // Cor: "up" é bom para receitas/saldo (verde quando sobe)
  // e ruim para despesas (vermelho quando sobe).
  const good =
    (direcaoPositiva === "up" && isUp) ||
    (direcaoPositiva === "down" && isDown);
  const bad =
    (direcaoPositiva === "up" && isDown) ||
    (direcaoPositiva === "down" && isUp);

  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  const label = isFlat
    ? "sem variação"
    : asPercent
      ? formatPercent(Math.abs(delta))
      : (delta > 0 ? "+" : "−") + formatPercent(Math.abs(delta));

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        good && "text-success",
        bad && "text-destructive",
        isFlat && "text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      <span className="font-normal text-muted-foreground">vs. mês anterior</span>
    </p>
  );
}
