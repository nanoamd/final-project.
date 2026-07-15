import {
  Columns3,
  CookingPot,
  Droplets,
  Flame,
  Gem,
  Headset,
  Home,
  LayoutGrid,
  Leaf,
  Lightbulb,
  type LucideIcon,
  Package,
  Rows3,
  ShieldCheck,
  Sofa,
  Sparkles,
  Sprout,
  Star,
  Truck,
  Warehouse,
  Waves,
} from "lucide-react";

/**
 * Resolves an icon-name string (stored in Sanity, since a schema can't hold a
 * React component) to its lucide-react component. Add new entries here
 * whenever a new icon name is introduced in a schema's options list.
 */
export const ICONS = {
  warehouse: Warehouse,
  droplets: Droplets,
  columns3: Columns3,
  sofa: Sofa,
  flame: Flame,
  "cooking-pot": CookingPot,
  lightbulb: Lightbulb,
  sprout: Sprout,
  waves: Waves,
  package: Package,
  rows3: Rows3,
  home: Home,
  leaf: Leaf,
  sparkles: Sparkles,
  gem: Gem,
  headset: Headset,
  truck: Truck,
  "shield-check": ShieldCheck,
  star: Star,
  "layout-grid": LayoutGrid,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function resolveIcon(name: string | null | undefined, fallback: LucideIcon = Leaf): LucideIcon {
  if (!name) return fallback;
  return ICONS[name as IconName] ?? fallback;
}
