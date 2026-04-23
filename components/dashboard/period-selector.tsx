"use client";

import { addMonths, format, parse, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import { formatDateBR } from "@/lib/utils/format";
import {
  presetToQuery,
  type PeriodMode,
  type PeriodPreset,
} from "@/lib/utils/period";

interface PeriodSelectorProps {
  mode: PeriodMode;
  /** "YYYY-MM" — presente em ambos os modos. */
  refMonthKey: string;
  /** YYYY-MM-DD. */
  inicio: string;
  /** YYYY-MM-DD. */
  fim: string;
}

const PRESETS: Array<{ id: PeriodPreset; label: string }> = [
  { id: "mes-atual", label: "Este mês" },
  { id: "mes-anterior", label: "Mês anterior" },
  { id: "ultimos-7", label: "Últimos 7 dias" },
  { id: "ultimos-30", label: "Últimos 30 dias" },
];

function parseMonthKey(key: string): Date {
  // Sempre tratado como local; como é apenas ano/mês, não há shift de TZ.
  return parse(`${key}-01`, "yyyy-MM-dd", new Date());
}

function formatMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function labelForMonthKey(key: string): string {
  const d = parseMonthKey(key);
  const raw = format(d, "MMMM 'de' yyyy", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function currentMonthKey(): string {
  return formatMonthKey(new Date());
}

export function PeriodSelector({
  mode,
  refMonthKey,
  inicio,
  fim,
}: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [customInicio, setCustomInicio] = useState(inicio);
  const [customFim, setCustomFim] = useState(fim);

  const thisMonth = currentMonthKey();
  const isFutureNavDisabled = mode === "month" && refMonthKey >= thisMonth;

  function navigate(query: Record<string, string>) {
    const params = new URLSearchParams();
    // Preserva params que não são do período (se houver outros no futuro)
    for (const [key, value] of searchParams.entries()) {
      if (!["ref", "inicio", "fim"].includes(key)) params.set(key, value);
    }
    for (const [key, value] of Object.entries(query)) {
      params.set(key, value);
    }
    // Não coloca ?ref= quando for o mês atual (URL mais limpa)
    if (query.ref && query.ref === thisMonth) params.delete("ref");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function goToMonth(key: string) {
    navigate({ ref: key });
  }

  function applyPreset(preset: PeriodPreset) {
    navigate(presetToQuery(preset));
    setOpen(false);
  }

  function applyCustom() {
    if (!customInicio || !customFim) return;
    if (customInicio > customFim) return;
    navigate({ inicio: customInicio, fim: customFim });
    setOpen(false);
  }

  const botaoCentralLabel =
    mode === "month"
      ? labelForMonthKey(refMonthKey)
      : `${formatDateBR(inicio)} – ${formatDateBR(fim)}`;

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
      {/* Seta esquerda: mês anterior (só no modo month) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={mode !== "month"}
        onClick={() => {
          const d = parseMonthKey(refMonthKey);
          goToMonth(formatMonthKey(subMonths(d, 1)));
        }}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Botão central — abre popover com presets e modo personalizado */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 min-w-[150px] gap-1.5 px-2 text-sm font-medium"
          >
            {mode === "range" && <CalendarRange className="h-3.5 w-3.5" />}
            <span className="capitalize">{botaoCentralLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-72">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Atalhos
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                      "hover:bg-muted",
                    )}
                    onClick={() => applyPreset(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Período personalizado
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="custom-inicio" className="text-xs">
                    De
                  </Label>
                  <Input
                    id="custom-inicio"
                    type="date"
                    value={customInicio}
                    max={customFim || undefined}
                    onChange={(e) => setCustomInicio(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-fim" className="text-xs">
                    Até
                  </Label>
                  <Input
                    id="custom-fim"
                    type="date"
                    value={customFim}
                    min={customInicio || undefined}
                    onChange={(e) => setCustomFim(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-2 w-full"
                disabled={
                  !customInicio || !customFim || customInicio > customFim
                }
                onClick={applyCustom}
              >
                Aplicar período
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Seta direita: próximo mês (só no modo month e se não for futuro) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={mode !== "month" || isFutureNavDisabled}
        onClick={() => {
          const d = parseMonthKey(refMonthKey);
          goToMonth(formatMonthKey(addMonths(d, 1)));
        }}
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
