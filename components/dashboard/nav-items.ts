import {
  ArrowLeftRight,
  LayoutDashboard,
  Repeat,
  Settings,
  Tags,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  showOnMobile?: boolean;
}

/** Itens de navegação do app autenticado. Fonte única para sidebar + bottom tab. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, showOnMobile: true },
  { label: "Transações", href: "/transacoes", icon: ArrowLeftRight, showOnMobile: true },
  { label: "Metas", href: "/metas", icon: Target, showOnMobile: true },
  { label: "Categorias", href: "/categorias", icon: Tags, showOnMobile: true },
  { label: "Recorrências", href: "/recorrencias", icon: Repeat, showOnMobile: false },
  { label: "Configurações", href: "/configuracoes", icon: Settings, showOnMobile: false },
];
