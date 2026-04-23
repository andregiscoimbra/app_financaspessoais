"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_ICON_KEYS,
  getCategoryIcon,
} from "@/lib/utils/category-icons";
import { categoriaSchema, type CategoriaInput } from "@/lib/validators/categories";
import type { Categoria } from "@/types";

import { atualizarCategoriaAction, criarCategoriaAction } from "./actions";

interface CategoryFormProps {
  categoria?: Categoria;
  tipoInicial?: "receita" | "despesa";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  categoria,
  tipoInicial,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = Boolean(categoria);

  const defaultValues = useMemo<CategoriaInput>(
    () => ({
      nome: categoria?.nome ?? "",
      tipo: (categoria?.tipo ?? tipoInicial ?? "despesa") as CategoriaInput["tipo"],
      cor: categoria?.cor ?? CATEGORY_COLORS[0],
      icone: categoria?.icone ?? "circle",
    }),
    [categoria, tipoInicial],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoriaInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues,
  });

  const corAtual = watch("cor") ?? CATEGORY_COLORS[0];
  const iconeAtual = watch("icone") ?? "circle";
  const tipoAtual = watch("tipo");
  const IconPreview = getCategoryIcon(iconeAtual);

  function onSubmit(values: CategoriaInput) {
    setServerError(null);
    startTransition(async () => {
      const result = isEdit && categoria
        ? await atualizarCategoriaAction(categoria.id, values)
        : await criarCategoriaAction(values);

      if (result.ok) {
        toast.success(isEdit ? "Categoria atualizada." : "Categoria criada.");
        onSuccess?.();
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Preview */}
      <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${corAtual}20`, color: corAtual }}
        >
          <IconPreview className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {watch("nome") || "Nome da categoria"}
          </p>
          <p className="text-xs text-muted-foreground">
            {tipoAtual === "receita" ? "Receita" : "Despesa"}
          </p>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" disabled={isPending} {...register("nome")} />
        {errors.nome && (
          <p className="text-xs text-destructive">{errors.nome.message}</p>
        )}
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValue("tipo", "despesa")}
            disabled={isPending}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              tipoAtual === "despesa"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-input bg-background hover:bg-muted",
            )}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setValue("tipo", "receita")}
            disabled={isPending}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              tipoAtual === "receita"
                ? "border-success bg-success/10 text-success"
                : "border-input bg-background hover:bg-muted",
            )}
          >
            Receita
          </button>
        </div>
      </div>

      {/* Cor */}
      <div className="space-y-1.5">
        <Label>Cor</Label>
        <Controller
          control={control}
          name="cor"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => field.onChange(cor)}
                  aria-label={`Cor ${cor}`}
                  aria-pressed={field.value === cor}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    field.value === cor
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Ícone */}
      <div className="space-y-1.5">
        <Label>Ícone</Label>
        <Controller
          control={control}
          name="icone"
          render={({ field }) => (
            <div className="grid max-h-48 grid-cols-9 gap-1.5 overflow-y-auto rounded-md border p-2 sm:grid-cols-10">
              {CATEGORY_ICON_KEYS.map((key) => {
                const Icon = CATEGORY_ICONS[key];
                const selected = field.value === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => field.onChange(key)}
                    aria-label={`Ícone ${key}`}
                    aria-pressed={selected}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
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
            "Salvar"
          ) : (
            "Criar categoria"
          )}
        </Button>
      </div>
    </form>
  );
}
