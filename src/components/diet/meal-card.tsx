"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeMeal, deleteMeal } from "@/lib/actions/diet";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types";

export function MealCard({ meal }: { meal: Tables<"meals"> }) {
  const [pending, startTransition] = useTransition();
  const completed = meal.status === "completed";

  const macros = [
    meal.calories ? `${meal.calories} kcal` : null,
    meal.protein_g ? `${meal.protein_g}g protein` : null,
    meal.carbs_g ? `${meal.carbs_g}g carbs` : null,
    meal.fat_g ? `${meal.fat_g}g fat` : null,
  ].filter(Boolean);

  return (
    <div className={cn("group flex flex-col gap-1 rounded-md border bg-background p-2", pending && "opacity-60")}>
      <div className="flex items-start justify-between gap-1">
        <span className={cn("text-sm font-medium", completed && "text-muted-foreground line-through")}>
          {meal.title}
        </span>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
          {!completed ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void completeMeal(meal.id);
                })
              }
            >
              <Check className="size-3.5" />
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={pending}
            onClick={() => startTransition(() => deleteMeal(meal.id))}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
      {meal.description ? <p className="text-xs text-muted-foreground">{meal.description}</p> : null}
      {macros.length ? <p className="text-xs text-muted-foreground">{macros.join(" · ")}</p> : null}
    </div>
  );
}
