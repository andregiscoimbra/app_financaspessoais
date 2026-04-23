import {
  Banknote,
  Bed,
  Bike,
  Briefcase,
  Bus,
  Car,
  Circle,
  Coffee,
  CreditCard,
  Droplet,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  type LucideIcon,
  Music,
  Pill,
  PiggyBank,
  Pizza,
  Plane,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  SprayCan,
  TrendingUp,
  Undo2,
  Users,
  Utensils,
  Wallet,
  Wifi,
} from "lucide-react";

/**
 * Mapa de ícones permitidos para categorias.
 * O banco (coluna `icone`) guarda a CHAVE — esta função traduz para o componente.
 *
 * Para adicionar um ícone novo: importe acima e inclua no objeto abaixo.
 * Mantenha a lista curta o suficiente para caber bem no picker.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Alimentação / bebida
  utensils: Utensils,
  pizza: Pizza,
  coffee: Coffee,
  "shopping-cart": ShoppingCart,

  // Casa
  home: Home,
  bed: Bed,
  "spray-can": SprayCan,

  // Transporte
  car: Car,
  bus: Bus,
  plane: Plane,
  bike: Bike,
  fuel: Fuel,

  // Saúde / pessoal
  "heart-pulse": HeartPulse,
  pill: Pill,
  droplet: Droplet,
  dumbbell: Dumbbell,
  sparkles: Sparkles,

  // Lazer / shopping
  "gamepad-2": Gamepad2,
  film: Film,
  music: Music,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  gift: Gift,

  // Tech
  laptop: Laptop,
  smartphone: Smartphone,
  wifi: Wifi,

  // Educação / trabalho
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,

  // Receita / financeiro
  wallet: Wallet,
  banknote: Banknote,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  "undo-2": Undo2,

  // Social
  users: Users,

  // Fallback neutro
  circle: Circle,
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS) as (keyof typeof CATEGORY_ICONS)[];

/** Retorna o componente para a chave. Fallback: Circle. */
export function getCategoryIcon(icone: string | null | undefined): LucideIcon {
  if (!icone) return Circle;
  return CATEGORY_ICONS[icone] ?? Circle;
}

/**
 * Cores sugeridas para categorias. O usuário pode digitar qualquer hex,
 * mas o picker oferece estas como atalho.
 */
export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate
  "#6b7280", // gray
];
