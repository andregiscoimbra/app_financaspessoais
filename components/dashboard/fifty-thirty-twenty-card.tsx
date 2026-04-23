import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { classificar5030, LABELS_5030, REFERENCIA_5030 } from "@/lib/utils/budget-groups";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatPercent } from "@/lib/utils/format";
import type { GrupoMeta, Grupo5030 } from "@/types";

interface CategoriaValor {
  nome: string;
  valor: number;
  /** Grupo configurado pelo usuário. Se null, cai no fallback pelo nome. */
  grupo?: GrupoMeta | null;
}

interface FiftyThirtyTwentyCardProps {
  /** Categorias de despesa + valor (gasto real OU meta orçada). */
  despesas: CategoriaValor[];
  /**
   * Se informado, calcula a poupança = (receitas − totalDespesas) / receitas.
   * Omita para esconder a linha de poupança (útil na tela de Metas).
   */
  receitas?: number;
  titulo?: string;
  descricao?: string;
}

export function FiftyThirtyTwentyCard({
  despesas,
  receitas,
  titulo = "Distribuição 50/30/20",
  descricao,
}: FiftyThirtyTwentyCardProps) {
  const totalDespesas = despesas.reduce((acc, c) => acc + c.valor, 0);

  const porGrupo: Record<Grupo5030, number> = {
    necessidades: 0,
    desejos: 0,
    poupanca: 0,
  };
  for (const c of despesas) {
    // Usa o grupo configurado pelo usuário; fallback pra classificação pelo nome.
    const grupo: Grupo5030 = c.grupo ?? classificar5030(c.nome);
    porGrupo[grupo] += c.valor;
  }

  const mostrarPoupanca = typeof receitas === "number" && receitas > 0;
  const poupanca = mostrarPoupanca ? Math.max(0, receitas - totalDespesas) : 0;

  const descricaoFinal =
    descricao ??
    (mostrarPoupanca
      ? "Referência saudável: 50% necessidades, 30% desejos, 20% poupança."
      : "Referência saudável: 50% necessidades, 30% desejos.");

  if (totalDespesas === 0 && !mostrarPoupanca) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{titulo}</CardTitle>
          <CardDescription>
            Sem dados para calcular a distribuição.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Para o cálculo de %: se tem receita, distribui sobre ela (receita = 100%).
  // Senão, distribui sobre o total de despesas.
  const totalReferencia = mostrarPoupanca ? receitas : totalDespesas;

  const grupos: Array<{ key: Grupo5030; atual: number }> = [
    { key: "necessidades", atual: porGrupo.necessidades / totalReferencia },
    { key: "desejos", atual: porGrupo.desejos / totalReferencia },
  ];
  if (mostrarPoupanca) {
    grupos.push({ key: "poupanca", atual: poupanca / totalReferencia });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>{descricaoFinal}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {grupos.map(({ key, atual }) => {
          const referencia = REFERENCIA_5030[key];
          const diff = atual - referencia;
          const dentroDaFaixa = Math.abs(diff) <= 0.05;

          // Para Necessidades/Desejos: gastar MENOS que a referência é OK (abaixo).
          // Para Poupança: gastar MENOS que a referência é RUIM (abaixo é insuficiente).
          const acimaRuim = key !== "poupanca" && diff > 0.05;
          const abaixoRuim = key === "poupanca" && diff < -0.05;

          const corBarra = dentroDaFaixa
            ? "bg-success"
            : acimaRuim
              ? "bg-warning"
              : abaixoRuim
                ? "bg-warning"
                : "bg-primary";

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{LABELS_5030[key]}</span>
                <div className="flex items-baseline gap-2">
                  <span className="tabular-nums">{formatPercent(atual)}</span>
                  <span className="text-xs text-muted-foreground">
                    ref. {formatPercent(referencia)}
                  </span>
                </div>
              </div>

              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full transition-all", corBarra)}
                  style={{ width: `${Math.min(atual, 1) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-foreground/50"
                  style={{ left: `${referencia * 100}%` }}
                  aria-label={`Referência ${formatPercent(referencia)}`}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-4 space-y-1 border-t pt-3 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Total {mostrarPoupanca ? "de despesas" : "das metas"}</span>
            <span className="tabular-nums">{formatBRL(totalDespesas)}</span>
          </div>
          {mostrarPoupanca && (
            <div className="flex justify-between text-muted-foreground">
              <span>Receitas</span>
              <span className="tabular-nums">{formatBRL(receitas)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
