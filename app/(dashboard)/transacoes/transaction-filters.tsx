"use client";

import { Filter, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types";

const MEIOS = [
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

interface TransactionFiltersProps {
  categorias: Categoria[];
}

export function TransactionFilters({ categorias }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const inicio = searchParams.get("inicio") ?? "";
  const fim = searchParams.get("fim") ?? "";
  const tipo = searchParams.get("tipo") ?? "";
  const categoriasFiltro = useMemo(
    () => (searchParams.get("categorias")?.split(",").filter(Boolean) ?? []) as string[],
    [searchParams],
  );
  const meiosFiltro = useMemo(
    () => (searchParams.get("meios")?.split(",").filter(Boolean) ?? []) as string[],
    [searchParams],
  );
  const busca = searchParams.get("busca") ?? "";

  const [buscaLocal, setBuscaLocal] = useState(busca);

  // Atualiza busca local se navegação mudar
  useEffect(() => {
    setBuscaLocal(busca);
  }, [busca]);

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      // Sempre volta pra página 1 quando filtros mudam
      params.delete("page");
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [pathname, router, searchParams],
  );

  // Debounce da busca por texto
  useEffect(() => {
    if (buscaLocal === busca) return;
    const id = setTimeout(() => {
      update({ busca: buscaLocal || null });
    }, 400);
    return () => clearTimeout(id);
  }, [buscaLocal, busca, update]);

  function togglePartOf(current: string[], value: string, key: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [key]: next.length > 0 ? next.join(",") : null });
  }

  const hasFilters =
    Boolean(inicio || fim || tipo || busca) ||
    categoriasFiltro.length > 0 ||
    meiosFiltro.length > 0;

  const activeFilterCount =
    (inicio ? 1 : 0) +
    (fim ? 1 : 0) +
    (tipo ? 1 : 0) +
    (categoriasFiltro.length > 0 ? 1 : 0) +
    (meiosFiltro.length > 0 ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por descrição ou estabelecimento…"
            className="pl-9"
            value={buscaLocal}
            onChange={(e) => setBuscaLocal(e.target.value)}
          />
        </div>

        {/* Tipo (toggle) */}
        <div className="inline-flex rounded-md border bg-background p-0.5 text-sm">
          {[
            { value: "", label: "Todos" },
            { value: "receita", label: "Receitas" },
            { value: "despesa", label: "Despesas" },
          ].map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => update({ tipo: opt.value || null })}
              className={cn(
                "rounded px-3 py-1.5 font-medium transition-colors",
                tipo === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filtros adicionais */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Período
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={inicio}
                  onChange={(e) => update({ inicio: e.target.value || null })}
                  aria-label="Data inicial"
                />
                <Input
                  type="date"
                  value={fim}
                  onChange={(e) => update({ fim: e.target.value || null })}
                  aria-label="Data final"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Categorias
              </Label>
              <div className="max-h-48 space-y-1 overflow-auto pr-1">
                {categorias.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem categorias.</p>
                )}
                {categorias.map((c) => {
                  const checked = categoriasFiltro.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          togglePartOf(categoriasFiltro, c.id, "categorias")
                        }
                      />
                      {c.cor && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.cor }}
                        />
                      )}
                      <span>{c.nome}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Meio de pagamento
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {MEIOS.map((m) => {
                  const checked = meiosFiltro.includes(m.value);
                  return (
                    <label
                      key={m.value}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          togglePartOf(meiosFiltro, m.value, "meios")
                        }
                      />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBuscaLocal("");
              router.push(pathname);
            }}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
