"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Dumbbell,
  LayoutGrid,
  Repeat,
  Settings,
  Sparkles,
  Target,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

const ICONS = {
  "layout-grid": LayoutGrid,
  "check-square": CheckSquare,
  "calendar-days": CalendarDays,
  target: Target,
  dumbbell: Dumbbell,
  utensils: Utensils,
  sparkles: Sparkles,
  repeat: Repeat,
  settings: Settings,
  "book-open": BookOpen,
} as const;

export function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
