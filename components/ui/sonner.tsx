"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toaster do app. Deve ser montado uma vez em app/layout.tsx.
 * Use `toast(...)` de "sonner" para disparar notificações.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
