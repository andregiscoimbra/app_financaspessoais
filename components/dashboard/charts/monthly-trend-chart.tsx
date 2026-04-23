"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthShort } from "@/lib/utils/dates";
import { formatBRL } from "@/lib/utils/format";

interface MonthlyTrendChartProps {
  dados: Array<{
    mes: Date;
    receitas: number;
    despesas: number;
  }>;
}

export function MonthlyTrendChart({ dados }: MonthlyTrendChartProps) {
  const chartData = dados.map((d) => ({
    label: formatMonthShort(d.mes),
    Receitas: d.receitas,
    Despesas: d.despesas,
    Saldo: d.receitas - d.despesas,
  }));

  const temDados = chartData.some(
    (d) => d.Receitas > 0 || d.Despesas > 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução dos últimos 6 meses</CardTitle>
        <CardDescription>Receitas, despesas e saldo mês a mês.</CardDescription>
      </CardHeader>
      <CardContent>
        {!temDados ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ainda não há histórico suficiente para traçar a evolução.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `${(v / 1000).toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        })}k`
                      : String(v)
                  }
                  className="text-muted-foreground"
                  width={50}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
                        <p className="mb-1 font-medium">{label}</p>
                        {payload.map((entry) => (
                          <p key={entry.dataKey} style={{ color: entry.color }}>
                            {entry.name}: {formatBRL(Number(entry.value))}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="Receitas"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Despesas"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
