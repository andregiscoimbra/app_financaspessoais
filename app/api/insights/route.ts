import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

import { buildInsightsPrompt } from "@/lib/prompts/insights";
import { listBudgetsVigentes } from "@/lib/queries/budgets";
import { listCategorias } from "@/lib/queries/categories";
import { gastoPorCategoriaComNome, getDashboardData } from "@/lib/queries/dashboard";
import { createClient } from "@/lib/supabase/server";
import { formatRefMonth, monthRange, parseRefMonth } from "@/lib/utils/dates";
import { formatMonthYear } from "@/lib/utils/format";
import { insightsArraySchema } from "@/lib/validators/insights";
import { subMonths } from "date-fns";

/** TTL do cache (em ms): 24h. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Modelo barato e rápido — adequado para sumarização estruturada. */
const MODEL = "claude-haiku-4-5-20251001";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // 1. Checa autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Checa se a chave está configurada
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Integração com IA não configurada. Adicione ANTHROPIC_API_KEY ao .env.local.",
        code: "missing_api_key",
      },
      { status: 503 },
    );
  }

  // 3. Parse do mês de referência (padrão: mês atual)
  const refParam = request.nextUrl.searchParams.get("ref");
  const refMonth = parseRefMonth(refParam);
  const refMonthIso = `${formatRefMonth(refMonth)}-01`;

  // 4. Consulta cache antes de chamar a API
  const { data: cached } = await supabase
    .from("ai_insights")
    .select("insights, generated_at")
    .eq("user_id", user.id)
    .eq("ref_month", refMonthIso)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.generated_at).getTime();
    if (age < CACHE_TTL_MS) {
      const parsed = insightsArraySchema.safeParse(cached.insights);
      if (parsed.success) {
        return NextResponse.json({
          insights: parsed.data,
          cached: true,
          generatedAt: cached.generated_at,
        });
      }
    }
  }

  // 5. Busca dados para o prompt (sempre o mês inteiro de referência)
  const { inicio: mesInicio, fim: mesFim } = monthRange(refMonth);
  const [dashboardData, categorias, budgets] = await Promise.all([
    getDashboardData(supabase, mesInicio, mesFim, refMonth),
    listCategorias(supabase, { incluirInativas: true }),
    listBudgetsVigentes(supabase),
  ]);

  // Só vale chamar a IA se há dados suficientes para análise
  if (dashboardData.totaisMes.despesas === 0 && dashboardData.totaisMes.receitas === 0) {
    return NextResponse.json({
      insights: [],
      empty: true,
    });
  }

  const metaPorCategoria: Record<string, number> = {};
  for (const b of budgets) metaPorCategoria[b.categoria_id] = Number(b.valor_mensal);

  const gastosComNome = gastoPorCategoriaComNome(
    dashboardData.gastoPorCategoria,
    categorias,
  );

  const topCategorias = gastosComNome.slice(0, 8).map((g) => {
    const cat = categorias.find((c) => c.id === g.categoria_id);
    const meta = cat ? (metaPorCategoria[cat.id] ?? 0) : 0;
    return { nome: g.nome, gasto: g.valor, meta };
  });

  const categoriasAcimaMeta = topCategorias.filter(
    (c) => c.meta > 0 && c.gasto > c.meta,
  );
  const categoriasEmAtencao = topCategorias.filter(
    (c) => c.meta > 0 && c.gasto / c.meta >= 0.8 && c.gasto <= c.meta,
  );

  // 6. Monta prompt e chama Claude
  const { system, user: userPrompt } = buildInsightsPrompt({
    refMonthLabel: formatMonthYear(refMonth),
    prevMonthLabel: formatMonthYear(subMonths(refMonth, 1)),
    totaisMes: dashboardData.totaisMes,
    totaisMesAnterior: dashboardData.totaisMesAnterior,
    topCategorias,
    categoriasAcimaMeta,
    categoriasEmAtencao,
  });

  let insights;
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Concatena blocos de texto da resposta
    const raw = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    // O modelo foi instruído a retornar { "insights": [...] } — extrai o array
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      // Se vier com cercas de markdown (``` json ... ```), limpa
      const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "");
      parsedJson = JSON.parse(cleaned);
    }

    const maybeArray =
      Array.isArray(parsedJson) ? parsedJson : (parsedJson as any)?.insights;

    const validated = insightsArraySchema.safeParse(maybeArray);
    if (!validated.success) {
      console.error("Resposta do Claude fora do schema:", raw);
      return NextResponse.json(
        { error: "Resposta da IA inválida.", code: "invalid_response" },
        { status: 502 },
      );
    }
    insights = validated.data;
  } catch (error) {
    console.error("Erro ao chamar Anthropic API:", error);
    return NextResponse.json(
      {
        error: "Não foi possível gerar insights agora.",
        code: "ai_error",
      },
      { status: 502 },
    );
  }

  // 7. Salva no cache (upsert por user_id + ref_month)
  const { error: cacheError } = await supabase.from("ai_insights").upsert(
    {
      user_id: user.id,
      ref_month: refMonthIso,
      insights,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,ref_month" },
  );

  if (cacheError) {
    // Não falha a request por causa do cache
    console.error("Erro ao salvar cache de insights:", cacheError);
  }

  return NextResponse.json({ insights, cached: false });
}
