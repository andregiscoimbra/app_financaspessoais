"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatPercent } from "@/lib/utils/format";

interface CategoryPieChartProps {
  dados: Array<{
    categoria_id: string;
    nome: string;
    cor: string | null;
    valor: number;
  }>;
}

const FALLBACK_COLOR = "#6b7280";
const MAX_SLICES = 8;

export function CategoryPieChart({ dados }: CategoryPieChartProps) {
  const total = dados.reduce((acc, d) => acc + d.valor, 0);

  // Se tem mais de MAX_SLICES categorias, agrupa as menores em "Outros"
  const chartData = useMemo(() => {
    if (dados.length <= MAX_SLICES) return dados;

    const top = dados.slice(0, MAX_SLICES - 1);
    const restante = dados.slice(MAX_SLICES - 1);
    const outros = restante.reduce((acc, d) => acc + d.valor, 0);

    return [
      ...top,
      { categoria_id: "outros", nome: "Outros", cor: FALLBACK_COLOR, valor: outros },
    ];
  }, [dados]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Despesas por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sem despesas no período.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={1.5}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.categoria_id} fill={entry.cor ?? FALLBACK_COLOR} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const valor = Number(item.value);
                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          {formatBRL(valor)} · {formatPercent(valor / total)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, lineHeight: 1.5, paddingTop: 16 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
