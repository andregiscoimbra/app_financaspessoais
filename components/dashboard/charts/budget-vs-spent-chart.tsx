"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatPercent } from "@/lib/utils/format";

interface BudgetVsSpentChartProps {
  dados: Array<{
    categoria_id: string;
    nome: string;
    cor: string | null;
    gasto: number;
    meta: number;
  }>;
}

export function BudgetVsSpentChart({ dados }: BudgetVsSpentChartProps) {
  // Ordena por % consumido da meta (maior primeiro) — foca no que está sobrando o menos
  const dadosOrdenados = [...dados]
    .filter((d) => d.meta > 0 || d.gasto > 0)
    .map((d) => ({ ...d, percent: d.meta > 0 ? d.gasto / d.meta : 1.01 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 10); // Limita a top 10 pra caber no gráfico

  const alturaDinamica = Math.max(200, dadosOrdenados.length * 36);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gasto vs. meta</CardTitle>
        <CardDescription>
          Top categorias do mês. Verde = dentro da meta, vermelho = passou.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dadosOrdenados.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sem metas nem gastos no mês.
          </p>
        ) : (
          <div style={{ height: alturaDinamica }}>
            <ResponsiveContainer>
              <BarChart
                data={dadosOrdenados}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  hide
                  domain={[
                    0,
                    (dataMax: number) =>
                      Math.max(
                        dataMax,
                        ...dadosOrdenados.map((d) => d.meta),
                      ) * 1.05,
                  ]}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-foreground"
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload as (typeof dadosOrdenados)[number];
                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-muted-foreground">
                          Gasto: {formatBRL(item.gasto)}
                        </p>
                        <p className="text-muted-foreground">
                          Meta: {item.meta > 0 ? formatBRL(item.meta) : "sem meta"}
                        </p>
                        {item.meta > 0 && (
                          <p className="mt-1 font-medium">
                            {formatPercent(item.gasto / item.meta)} da meta
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="gasto"
                  radius={[0, 4, 4, 0]}
                  label={({ x, y, width, height, value }) => {
                    const v = Number(value);
                    if (v <= 0) return <g />;
                    return (
                      <text
                        x={Number(x) + Number(width) + 6}
                        y={Number(y) + Number(height) / 2 + 4}
                        fontSize={11}
                        fill="currentColor"
                        className="fill-muted-foreground"
                      >
                        {formatBRL(v)}
                      </text>
                    );
                  }}
                >
                  {dadosOrdenados.map((d) => {
                    const hasMeta = d.meta > 0;
                    const ratio = hasMeta ? d.gasto / d.meta : 1;
                    // Sem meta: cinza neutro. Dentro: verde. Passou: vermelho.
                    const fill = !hasMeta
                      ? "hsl(var(--muted-foreground))"
                      : ratio > 1
                        ? "hsl(var(--destructive))"
                        : ratio > 0.8
                          ? "hsl(var(--warning))"
                          : "hsl(var(--success))";
                    return <Cell key={d.categoria_id} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
