"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classificar5030, LABELS_5030 } from "@/lib/utils/budget-groups";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatPercent } from "@/lib/utils/format";
import { budgetsFormSchema, type BudgetsFormInput } from "@/lib/validators/budgets";
import type { Categoria, Grupo5030 } from "@/types";

import { salvarMetasAction } from "./actions";

interface BudgetsFormProps {
  despesas: Categoria[];
  /** Mapa categoria_id → valor mensal atual (0 se não tem meta). */
  metasAtuais: Record<string, number>;
}

export function BudgetsForm({ despesas, metasAtuais }: BudgetsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues: BudgetsFormInput = useMemo(
    () => ({
      budgets: despesas.map((c) => ({
        categoria_id: c.id,
        valor_mensal: (metasAtuais[c.id] ?? 0) as number,
      })),
    }),
    [despesas, metasAtuais],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BudgetsFormInput>({
    resolver: zodResolver(budgetsFormSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({ control, name: "budgets" });

  const watchedRaw = useWatch({ control, name: "budgets" });
  const watched = useMemo(() => watchedRaw ?? [], [watchedRaw]);

  const totais = useMemo(() => {
    const total = watched.reduce(
      (acc, b) => acc + (Number(b?.valor_mensal) || 0),
      0,
    );
    return { total };
  }, [watched]);

  // Agrupa por Necessidade/Desejo: usa grupo_meta da categoria (configurado
  // pelo usuário); fallback pra classificação pelo nome se ainda não tiver.
  const gruposOrdenados: Array<{ grupo: Grupo5030; categorias: Categoria[] }> = useMemo(() => {
    const map: Record<Grupo5030, Categoria[]> = {
      necessidades: [],
      desejos: [],
      poupanca: [],
    };
    for (const c of despesas) {
      const grupo: Grupo5030 = c.grupo_meta ?? classificar5030(c.nome);
      map[grupo].push(c);
    }
    return [
      { grupo: "necessidades", categorias: map.necessidades },
      { grupo: "desejos", categorias: map.desejos },
    ];
  }, [despesas]);

  const indiceDaCategoria = useMemo(() => {
    const m = new Map<string, number>();
    fields.forEach((f, idx) => m.set(f.categoria_id, idx));
    return m;
  }, [fields]);

  function onSubmit(values: BudgetsFormInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await salvarMetasAction(values);
      if (result.ok) {
        toast.success("Metas salvas.");
        // Re-sincroniza o "isDirty" com os valores atuais
        reset(values);
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Totalizador sticky */}
      <div className="sticky top-16 z-10 -mx-4 flex flex-col gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:-mx-0 md:rounded-lg md:border md:p-3 md:shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">Total mensal das metas:</span>
          <span className="text-base font-semibold tabular-nums">
            {formatBRL(totais.total)}
          </span>
        </div>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <Save />
              Salvar metas
            </>
          )}
        </Button>
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {serverError}
        </div>
      )}

      {gruposOrdenados.map(({ grupo, categorias }) => {
        if (categorias.length === 0) return null;
        return (
          <Card key={grupo}>
            <CardHeader>
              <CardTitle className="text-base">{LABELS_5030[grupo]}</CardTitle>
              <CardDescription>
                {grupo === "necessidades"
                  ? "Referência: ~50% do total. Gastos essenciais (casa, alimentação, saúde, transporte trabalho, etc)."
                  : "Referência: ~30% do total. Qualidade de vida (lazer, beleza, roupas, etc)."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <ul className="divide-y">
                {categorias.map((c) => {
                  const idx = indiceDaCategoria.get(c.id);
                  if (idx === undefined) return null;

                  const valor = Number(watched[idx]?.valor_mensal) || 0;
                  const percent = totais.total > 0 ? valor / totais.total : 0;
                  const Icon = getCategoryIcon(c.icone);
                  const cor = c.cor ?? "#6b7280";
                  const err = errors.budgets?.[idx]?.valor_mensal;

                  return (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${cor}20`, color: cor }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor={`budget-${c.id}`}
                          className="block truncate text-sm font-medium"
                        >
                          {c.nome}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {totais.total > 0 ? formatPercent(percent) : "—"} do total
                        </p>
                      </div>

                      <input
                        type="hidden"
                        {...register(`budgets.${idx}.categoria_id` as const)}
                      />
                      <div className="w-36 shrink-0">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            R$
                          </span>
                          <Input
                            id={`budget-${c.id}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            className={cn(
                              "pl-9 text-right tabular-nums",
                              err && "border-destructive",
                            )}
                            disabled={isPending}
                            {...register(`budgets.${idx}.valor_mensal` as const)}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {/* Rodapé com botão duplicado pra não precisar scrollar até o topo */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !isDirty} size="lg">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <Save />
              Salvar metas
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
