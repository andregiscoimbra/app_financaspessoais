import { formatBRL, formatPercent } from "@/lib/utils/format";

interface CategoriaGasto {
  nome: string;
  gasto: number;
  meta: number;
}

interface BuildInsightsPromptInput {
  refMonthLabel: string; // ex: "abril de 2026"
  prevMonthLabel: string; // ex: "março de 2026"
  totaisMes: { receitas: number; despesas: number };
  totaisMesAnterior: { receitas: number; despesas: number };
  topCategorias: CategoriaGasto[]; // top 8 por gasto no mês atual
  categoriasAcimaMeta: CategoriaGasto[]; // as que passaram de 100%
  categoriasEmAtencao: CategoriaGasto[]; // 80–100%
}

/**
 * Constrói o prompt para o Claude Haiku. O system prompt define o papel,
 * o user prompt contém os dados estruturados + instrução de output.
 */
export function buildInsightsPrompt(input: BuildInsightsPromptInput): {
  system: string;
  user: string;
} {
  const saldoMes = input.totaisMes.receitas - input.totaisMes.despesas;
  const saldoAnterior =
    input.totaisMesAnterior.receitas - input.totaisMesAnterior.despesas;

  const taxaPoupanca =
    input.totaisMes.receitas > 0
      ? saldoMes / input.totaisMes.receitas
      : null;

  const system = [
    "Você é um assistente financeiro brasileiro especializado em finanças pessoais.",
    "Sua missão é analisar os dados do mês do usuário e gerar observações úteis e acionáveis.",
    "Use sempre português brasileiro. Seja objetivo, sem clichês motivacionais vazios.",
    "Escolha emojis que combinam com o tom: ✅ (positivo), ⚠️ (atenção), 🚨 (alerta crítico), 💡 (insight), 📊 (comparação), 🎯 (meta).",
  ].join(" ");

  const linhasCategorias = input.topCategorias.length
    ? input.topCategorias
        .map(
          (c) =>
            `- ${c.nome}: gasto ${formatBRL(c.gasto)}` +
            (c.meta > 0
              ? ` (meta ${formatBRL(c.meta)}, ${formatPercent(c.gasto / c.meta)} da meta)`
              : " (sem meta definida)"),
        )
        .join("\n")
    : "Nenhuma despesa no mês.";

  const linhasAcimaMeta = input.categoriasAcimaMeta
    .map(
      (c) =>
        `- ${c.nome}: ${formatBRL(c.gasto)} (meta ${formatBRL(c.meta)}, ${formatPercent(c.gasto / c.meta)})`,
    )
    .join("\n");

  const linhasAtencao = input.categoriasEmAtencao
    .map(
      (c) =>
        `- ${c.nome}: ${formatBRL(c.gasto)} (meta ${formatBRL(c.meta)}, ${formatPercent(c.gasto / c.meta)})`,
    )
    .join("\n");

  const user = `Dados do mês de ${input.refMonthLabel}:

Totais:
- Receitas: ${formatBRL(input.totaisMes.receitas)}
- Despesas: ${formatBRL(input.totaisMes.despesas)}
- Saldo: ${formatBRL(saldoMes)}${taxaPoupanca !== null ? ` (taxa de poupança ${formatPercent(taxaPoupanca)})` : ""}

Comparação com ${input.prevMonthLabel}:
- Receitas anteriores: ${formatBRL(input.totaisMesAnterior.receitas)}
- Despesas anteriores: ${formatBRL(input.totaisMesAnterior.despesas)}
- Saldo anterior: ${formatBRL(saldoAnterior)}

Top gastos por categoria (mês atual):
${linhasCategorias}

${
  input.categoriasAcimaMeta.length
    ? `Categorias que PASSARAM da meta:\n${linhasAcimaMeta}\n`
    : ""
}${
    input.categoriasEmAtencao.length
      ? `Categorias em ATENÇÃO (80–100% da meta):\n${linhasAtencao}\n`
      : ""
  }
Gere entre 2 e 4 insights sobre estes dados. Cada insight deve ter:
- emoji (1 emoji apropriado)
- titulo (até 60 caracteres — direto ao ponto)
- descricao (até 140 caracteres — com número concreto quando possível)

Priorize observações que levem a uma decisão (cortar, realocar, comemorar). Não repita os mesmos números entre insights — escolha os mais relevantes.

Retorne APENAS um JSON válido no seguinte formato, sem markdown nem comentários:
{"insights":[{"emoji":"⚠️","titulo":"...","descricao":"..."}]}`;

  return { system, user };
}
