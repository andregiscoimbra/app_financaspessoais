"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BudgetAlertItem } from "@/lib/utils/budget-alerts";
import { cn } from "@/lib/utils/cn";
import { formatBRL, formatPercent } from "@/lib/utils/format";

const STORAGE_KEY = "dismissed_budget_alerts_v1";

interface BudgetAlertsProps {
  refMonth: string; // YYYY-MM — usado como key pra dismissal
  alerts: BudgetAlertItem[];
}

export function BudgetAlerts({ refMonth, alerts }: BudgetAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Hidrata do localStorage só depois do mount (evita mismatch SSR)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string[]>;
        const forMonth = parsed[refMonth];
        if (Array.isArray(forMonth)) {
          setDismissed(new Set(forMonth));
        }
      }
    } catch {
      // localStorage pode estar indisponível (modo privado antigo etc.) — ignora.
    }
    setHydrated(true);
  }, [refMonth]);

  function dismiss(categoria_id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(categoria_id);
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed: Record<string, string[]> = stored ? JSON.parse(stored) : {};
        parsed[refMonth] = Array.from(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // ignora
      }
      return next;
    });
  }

  const visible = useMemo(() => {
    if (!hydrated) return [];
    return alerts.filter((a) => !dismissed.has(a.categoria_id));
  }, [alerts, dismissed, hydrated]);

  // Evita piscar a UI enquanto hidrata (mostra vazio até ler localStorage)
  if (!hydrated || visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert) => (
        <div
          key={alert.categoria_id}
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 text-sm",
            alert.severity === "critical"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-warning/30 bg-warning/10 text-warning-foreground",
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {alert.severity === "critical" ? "🚨" : "⚠️"} {alert.nome}:{" "}
              {alert.severity === "critical"
                ? `meta ultrapassada em ${formatBRL(alert.gasto - alert.meta)}`
                : `${formatPercent(alert.percent)} da meta consumida`}
            </p>
            <p className="text-xs opacity-80">
              Gasto: {formatBRL(alert.gasto)} de {formatBRL(alert.meta)} orçados.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => dismiss(alert.categoria_id)}
            aria-label="Dispensar alerta"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// O util `buildBudgetAlerts` vive em `lib/utils/budget-alerts.ts` (server-safe).
// Não pode ficar aqui: arquivos com "use client" marcam todas as exportações
// como client references e quebram quando importadas por Server Components.
