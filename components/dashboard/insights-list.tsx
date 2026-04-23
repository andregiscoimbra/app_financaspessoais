"use client";

import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsightValidated } from "@/lib/validators/insights";

interface InsightsListProps {
  /** Formato YYYY-MM. */
  refMonth: string;
}

interface ApiResponse {
  insights?: InsightValidated[];
  cached?: boolean;
  generatedAt?: string;
  empty?: boolean;
  error?: string;
  code?: string;
}

export function InsightsList({ refMonth }: InsightsListProps) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ok"; data: InsightValidated[]; cached: boolean }
    | { status: "empty" }
    | { status: "error"; message: string; code?: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/insights?ref=${refMonth}`, { cache: "no-store" })
      .then(async (r) => {
        const body: ApiResponse = await r.json().catch(() => ({}));
        if (cancelled) return;

        if (!r.ok) {
          setState({
            status: "error",
            message: body.error ?? "Erro ao carregar insights.",
            code: body.code,
          });
          return;
        }

        if (body.empty || !body.insights || body.insights.length === 0) {
          setState({ status: "empty" });
          return;
        }

        setState({
          status: "ok",
          data: body.insights,
          cached: Boolean(body.cached),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Falha de rede. Tente novamente mais tarde.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refMonth]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Insights do mês
          {state.status === "ok" && state.cached && (
            <span className="text-xs font-normal text-muted-foreground">
              (em cache)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && <InsightsSkeleton />}

        {state.status === "empty" && (
          <p className="py-2 text-sm text-muted-foreground">
            Sem dados suficientes no mês para gerar insights. Cadastre transações
            para que a IA possa analisar.
          </p>
        )}

        {state.status === "ok" && (
          <ul className="space-y-3">
            {state.data.map((insight, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 rounded-md border bg-muted/30 p-3"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {insight.emoji}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{insight.titulo}</p>
                  <p className="text-xs text-muted-foreground">{insight.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {state.status === "error" && (
          <InsightsError message={state.message} code={state.code} />
        )}
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground">
        <RefreshCw className="mr-1 inline h-3 w-3 animate-spin" />
        A IA está analisando seus dados…
      </p>
    </div>
  );
}

function InsightsError({
  message,
  code,
}: {
  message: string;
  code?: string;
}) {
  const isSetup = code === "missing_api_key";

  return (
    <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">
          {isSetup ? "IA não configurada" : "Não foi possível gerar insights"}
        </p>
        <p className="text-xs text-muted-foreground">{message}</p>
        {isSetup && (
          <p className="text-xs text-muted-foreground">
            Adicione <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code>{" "}
            ao arquivo <code className="rounded bg-muted px-1">.env.local</code> e
            reinicie o servidor.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Pequeno botão de refresh — útil se o usuário quer forçar um novo cálculo
 * (ainda assim respeita o TTL do cache no servidor).
 */
export function InsightsRefreshButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <RefreshCw className="h-3.5 w-3.5" />
      Atualizar
    </Button>
  );
}
