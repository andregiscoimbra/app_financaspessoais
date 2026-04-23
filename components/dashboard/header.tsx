import { PiggyBank } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

import { UserMenu } from "./user-menu";

interface HeaderProps {
  email: string;
}

export function Header({ email }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      {/* Logo — visível só no mobile (no desktop, já está na sidebar) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PiggyBank className="h-4 w-4" />
        </div>
        <span className="font-semibold">Finanças</span>
      </div>

      {/* Espaçador no desktop pra empurrar os botões pra direita */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
