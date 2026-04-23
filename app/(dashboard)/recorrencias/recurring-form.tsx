"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import {
  recorrenciaSchema,
  type RecorrenciaInput,
} from "@/lib/validators/recurring-transactions";
import type { Categoria, TransacaoRecorrente } from "@/types";

import {
  atualizarRecorrenciaAction,
  criarRecorrenciaAction,
} from "./actions";

const LABEL_MEIOS: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
  pix: "Pix",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

interface RecurringFormProps {
  categorias: Categoria[];
  recorrencia?: TransacaoRecorrente;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecurringForm({
  categorias,
  recorrencia,
  onSuccess,
  onCancel,
}: RecurringFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = Boolean(recorrencia);

  const defaultValues = useMemo<RecorrenciaInput>(
    () => ({
      tipo: recorrencia?.tipo ?? "despesa",
      valor: (recorrencia?.valor ?? ("" as unknown)) as number,
      descricao: recorrencia?.descricao ?? "",
      estabelecimento: recorrencia?.estabelecimento ?? "",
      categoria_id: recorrencia?.categoria_id ?? "",
      meio_pagamento: recorrencia?.meio_pagamento ?? undefined,
      dia_do_mes: recorrencia?.dia_do_mes ?? 1,
      vigente_desde: recorrencia?.vigente_desde ?? hojeISO(),
      vigente_ate: recorrencia?.vigente_ate ?? "",
      ativa: recorrencia?.ativa ?? true,
    }),
    [recorrencia],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecorrenciaInput>({
    resolver: zodResolver(recorrenciaSchema),
    defaultValues,
  });

  const tipoAtual = watch("tipo");
  const categoriaAtual = watch("categoria_id");

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipoAtual && c.ativa),
    [categorias, tipoAtual],
  );

  function onSubmit(values: RecorrenciaInput) {
    setServerError(null);
    startTransition(async () => {
      const result = isEdit && recorrencia
        ? await atualizarRecorrenciaAction(recorrencia.id, values)
        : await criarRecorrenciaAction(values);

      if (result.ok) {
        const backfilled =
          !isEdit && "data" in result && result.data
            ? (result.data as { backfilled?: number }).backfilled ?? 0
            : 0;
        if (backfilled > 0) {
          toast.success(
            `Recorrência criada. ${backfilled} transação${backfilled === 1 ? "" : "ões"} gerada${backfilled === 1 ? "" : "s"} retroativamente.`,
          );
        } else {
          toast.success(isEdit ? "Recorrência atualizada." : "Recorrência criada.");
        }
        onSuccess?.();
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setValue("tipo", "despesa");
            const cat = categorias.find((c) => c.id === categoriaAtual);
            if (cat && cat.tipo !== "despesa") setValue("categoria_id", "");
          }}
          disabled={isPending}
          className={cn(
            "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
            tipoAtual === "despesa"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-input bg-background hover:bg-muted",
          )}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("tipo", "receita");
            const cat = categorias.find((c) => c.id === categoriaAtual);
            if (cat && cat.tipo !== "receita") setValue("categoria_id", "");
          }}
          disabled={isPending}
          className={cn(
            "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
            tipoAtual === "receita"
              ? "border-success bg-success/10 text-success"
              : "border-input bg-background hover:bg-muted",
          )}
        >
          Receita
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            disabled={isPending}
            {...register("valor")}
          />
          {errors.valor && (
            <p className="text-xs text-destructive">{errors.valor.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dia_do_mes">Dia do mês</Label>
          <Input
            id="dia_do_mes"
            type="number"
            min={1}
            max={31}
            step={1}
            disabled={isPending}
            {...register("dia_do_mes")}
          />
          {errors.dia_do_mes ? (
            <p className="text-xs text-destructive">{errors.dia_do_mes.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Dia 31 cai no último dia do mês quando não existe.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoria_id">Categoria</Label>
        <Controller
          control={control}
          name="categoria_id"
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
              disabled={isPending || categoriasDoTipo.length === 0}
            >
              <SelectTrigger id="categoria_id">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoria_id && (
          <p className="text-xs text-destructive">{errors.categoria_id.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          type="text"
          placeholder={tipoAtual === "despesa" ? "Condomínio" : "Salário"}
          disabled={isPending}
          {...register("descricao")}
        />
        {errors.descricao && (
          <p className="text-xs text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="estabelecimento">
          Estabelecimento <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="estabelecimento"
          type="text"
          placeholder="Vivo, Empresa X…"
          disabled={isPending}
          {...register("estabelecimento")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="meio_pagamento">
          Meio de pagamento <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Controller
          control={control}
          name="meio_pagamento"
          render={({ field }) => (
            <Select
              value={field.value ?? undefined}
              onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}
              disabled={isPending}
            >
              <SelectTrigger id="meio_pagamento">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {(Object.keys(LABEL_MEIOS) as (keyof typeof LABEL_MEIOS)[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {LABEL_MEIOS[key]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="vigente_desde">Vigente desde</Label>
          <Input
            id="vigente_desde"
            type="date"
            disabled={isPending}
            {...register("vigente_desde")}
          />
          {errors.vigente_desde && (
            <p className="text-xs text-destructive">{errors.vigente_desde.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vigente_ate">
            Vigente até <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="vigente_ate"
            type="date"
            disabled={isPending}
            {...register("vigente_ate")}
          />
          {errors.vigente_ate && (
            <p className="text-xs text-destructive">{errors.vigente_ate.message}</p>
          )}
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {serverError}
        </div>
      )}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              {isEdit ? "Salvando…" : "Criando…"}
            </>
          ) : isEdit ? (
            "Salvar alterações"
          ) : (
            "Salvar recorrência"
          )}
        </Button>
      </div>
    </form>
  );
}
