export type NavIconName =
  | "layout-grid"
  | "check-square"
  | "calendar-days"
  | "target"
  | "dumbbell"
  | "utensils"
  | "sparkles"
  | "repeat"
  | "settings"
  | "book-open";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/today", label: "Home", icon: "layout-grid" },
  { href: "/tasks", label: "Tasks", icon: "check-square" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/training", label: "Training", icon: "dumbbell" },
  { href: "/diet", label: "Diet", icon: "utensils" },
];

// Calendar (/calendar), Routines (/routines) code stays, just unlinked from
// navigation for now. Review was removed along with its page.
export const SECONDARY_NAV: NavItem[] = [
  { href: "/diary", label: "Diary", icon: "book-open" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
