"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  atualizarTransacaoAction,
  criarTransacaoAction,
} from "@/app/(dashboard)/transacoes/actions";
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
import { formatBRL } from "@/lib/utils/format";
import {
  transacaoComParcelasSchema,
  type TransacaoComParcelasInput,
} from "@/lib/validators/transactions";
import type { Categoria, Transacao } from "@/types";

const LABEL_MEIOS: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
  pix: "Pix",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

interface TransactionFormProps {
  categorias: Categoria[];
  transacao?: Transacao;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  categorias,
  transacao,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = Boolean(transacao);

  const defaultValues = useMemo<TransacaoComParcelasInput>(
    () => ({
      tipo: transacao?.tipo ?? "despesa",
      valor: (transacao?.valor ?? ("" as unknown)) as number,
      data: transacao?.data ?? hojeISO(),
      descricao: transacao?.descricao ?? "",
      estabelecimento: transacao?.estabelecimento ?? "",
      categoria_id: transacao?.categoria_id ?? "",
      meio_pagamento: transacao?.meio_pagamento ?? undefined,
      parcelar: false,
      parcelas: undefined,
    }),
    [transacao],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransacaoComParcelasInput>({
    resolver: zodResolver(transacaoComParcelasSchema),
    defaultValues,
  });

  const tipoAtual = watch("tipo");
  const categoriaAtual = watch("categoria_id");
  const parcelar = watch("parcelar");
  const parcelas = watch("parcelas");
  const valorRaw = watch("valor");

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipoAtual && c.ativa),
    [categorias, tipoAtual],
  );

  // Valor parseado de string → número (pra preview do parcelamento)
  const valorNumerico = useMemo(() => {
    const v = valorRaw as unknown;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v.replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }, [valorRaw]);

  const valorParcela =
    parcelar && parcelas && parcelas >= 2 && valorNumerico > 0
      ? valorNumerico / parcelas
      : 0;

  function onSubmit(values: TransacaoComParcelasInput) {
    setServerError(null);
    startTransition(async () => {
      const result = isEdit && transacao
        ? await atualizarTransacaoAction(transacao.id, values)
        : await criarTransacaoAction(values);

      if (result.ok) {
        if (isEdit) {
          toast.success("Transação atualizada.");
        } else if ("data" in result && result.data && result.data.count > 1) {
          toast.success(`${result.data.count} parcelas criadas.`);
        } else {
          toast.success("Transação criada.");
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
      {/* Toggle tipo */}
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
            // Parcelamento não se aplica a receita
            if (parcelar) {
              setValue("parcelar", false);
              setValue("parcelas", undefined);
            }
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
          <Label htmlFor="data">
            {parcelar ? "Data da 1ª parcela" : "Data"}
          </Label>
          <Input id="data" type="date" disabled={isPending} {...register("data")} />
          {errors.data && (
            <p className="text-xs text-destructive">{errors.data.message}</p>
          )}
        </div>
      </div>

      {/* Parcelamento — só para despesas, só ao criar (não faz sentido editar parcela isolada) */}
      {tipoAtual === "despesa" && !isEdit && (
        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("parcelar", false);
                  setValue("parcelas", undefined);
                }}
                disabled={isPending}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  !parcelar
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background hover:bg-muted",
                )}
              >
                À vista
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("parcelar", true);
                  if (!parcelas) setValue("parcelas", 2);
                }}
                disabled={isPending}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  parcelar
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background hover:bg-muted",
                )}
              >
                Parcelado
              </button>
            </div>
          </div>

          {parcelar && (
            <div className="space-y-1.5">
              <Label htmlFor="parcelas">Número de parcelas</Label>
              <Controller
                control={control}
                name="parcelas"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={isPending}
                  >
                    <SelectTrigger id="parcelas">
                      <SelectValue placeholder="Quantas parcelas?" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.parcelas && (
                <p className="text-xs text-destructive">
                  {errors.parcelas.message as string}
                </p>
              )}
              {valorParcela > 0 && parcelas && (
                <p className="text-xs text-muted-foreground">
                  Serão criadas <strong>{parcelas}</strong> transações de{" "}
                  <strong>{formatBRL(valorParcela)}</strong>, uma por mês,
                  começando na data informada.
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
                <SelectValue
                  placeholder={
                    categoriasDoTipo.length === 0
                      ? "Nenhuma categoria disponível"
                      : "Selecione uma categoria"
                  }
                />
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
          placeholder={tipoAtual === "despesa" ? "Uber trabalho" : "Salário fevereiro"}
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
          placeholder="Uber, Amazon, Empresa X…"
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
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
          ) : parcelar && parcelas ? (
            `Criar ${parcelas} parcelas`
          ) : (
            "Salvar transação"
          )}
        </Button>
      </div>
    </form>
  );
}
