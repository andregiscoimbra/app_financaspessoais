"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatRefMonth, nextMonth, prevMonth } from "@/lib/utils/dates";
import { formatMonthYear } from "@/lib/utils/format";

interface MonthSelectorProps {
  refMonth: Date;
}

export function MonthSelector({ refMonth }: MonthSelectorProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isCurrentOrFuture = refMonth >= startOfCurrentMonth();

  function buildHref(target: Date) {
    const params = new URLSearchParams(searchParams.toString());
    const ref = formatRefMonth(target);
    // Remove o parâmetro se for o mês atual (URL mais limpa)
    if (ref === formatRefMonth(new Date())) params.delete("ref");
    else params.set("ref", ref);
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link
          href={buildHref(prevMonth(refMonth))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      <span className="min-w-[130px] px-2 text-center text-sm font-medium capitalize">
        {formatMonthYear(refMonth)}
      </span>

      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={isCurrentOrFuture}
      >
        <Link
          href={buildHref(nextMonth(refMonth))}
          aria-label="Próximo mês"
          aria-disabled={isCurrentOrFuture}
          className={isCurrentOrFuture ? "pointer-events-none opacity-40" : undefined}
          tabIndex={isCurrentOrFuture ? -1 : undefined}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
