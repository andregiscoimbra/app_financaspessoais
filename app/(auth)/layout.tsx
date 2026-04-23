import { PiggyBank, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Layout das rotas (auth): split-screen com painel visual (desktop) + formulário.
 * No mobile, só o formulário aparece.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:grid md:grid-cols-2">
      {/* Painel visual — escondido no mobile */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur-sm">
            <PiggyBank className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Finanças Pessoais</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-balance text-4xl font-semibold leading-tight">
            Controle suas finanças. <br />
            <span className="text-primary-foreground/80">Descubra para onde vai seu dinheiro.</span>
          </h1>
          <p className="text-primary-foreground/80">
            Registre receitas e despesas, defina metas por categoria e receba
            insights automáticos para tomar decisões melhores.
          </p>
          <ul className="space-y-3 pt-2 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15">
                <Wallet className="h-3.5 w-3.5" />
              </span>
              <span>Lançamento em menos de 10 segundos</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
              <span>Gráficos e comparativos mês a mês</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15">
                <PiggyBank className="h-3.5 w-3.5" />
              </span>
              <span>Metas com benchmark 50/30/20</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Dashboard de Finanças Pessoais
        </p>

        {/* Ornamentos sutis */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl"
        />
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {/* Logo compacto (mobile) */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PiggyBank className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Finanças Pessoais</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
