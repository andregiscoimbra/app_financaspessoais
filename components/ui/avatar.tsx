import * as React from "react";

import { cn } from "@/lib/utils/cn";

interface AvatarInitialsProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

/**
 * Avatar simples baseado em iniciais do nome/email.
 * Evita carregar @radix-ui/react-avatar para manter o bundle enxuto.
 */
export function AvatarInitials({ name, className, ...props }: AvatarInitialsProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "inline-flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground",
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      {initials}
    </div>
  );
}

function getInitials(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "?";

  // Se for um e-mail, usa a parte antes do @
  const base = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;

  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
