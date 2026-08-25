"use client";

import { useState, useTransition } from "react";
import { Check, Flame } from "lucide-react";
import { toggleGoalCheckin } from "@/lib/actions/goals";
import { cn } from "@/lib/utils";
import type { GoalCheckFrequency } from "@/lib/types";

const PERIOD_LABEL: Record<GoalCheckFrequency, string> = {
  none: "",
  daily: "today",
  weekly: "this week",
  monthly: "this month",
};

/**
 * The check-in control is deliberately the most visually prominent element
 * wherever it appears — a big, satisfying tap target in a warm faded orange
 * once checked, not a small system checkbox (user feedback: make checks
 * bigger and more central).
 */
export function GoalCheckinToggle({
  goalId,
  frequency,
  doneThisPeriod,
  streak,
  size = "default",
  showLabel = true,
}: {
  goalId: string;
  frequency: GoalCheckFrequency;
  doneThisPeriod: boolean;
  streak: number;
  size?: "default" | "sm";
  showLabel?: boolean;
}) {
  const [done, setDone] = useState(doneThisPeriod);
  const [pending, startTransition] = useTransition();

  if (frequency === "none") return null;

  function toggle() {
    if (pending) return;
    const next = !done;
    setDone(next);
    startTransition(() => {
      void toggleGoalCheckin(goalId, frequency, next);
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark done ${PERIOD_LABEL[frequency]}`}
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          toggle();
        }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border-2 transition-all disabled:opacity-60",
          size === "sm" ? "size-8" : "size-11",
          done
            ? "border-orange-300 bg-orange-100 text-orange-600 shadow-[0_0_0_3px_rgba(249,115,22,0.08)] dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-400"
            : "border-muted-foreground/25 bg-transparent text-transparent hover:border-orange-300/70 hover:bg-orange-50 dark:hover:bg-orange-950/20",
        )}
      >
        <Check className={cn(size === "sm" ? "size-4" : "size-5", "stroke-[3]")} />
      </button>
      {showLabel ? (
        <div className="flex flex-col">
          <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
            Done {PERIOD_LABEL[frequency]}
          </span>
          {streak > 0 ? (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
              <Flame className="size-3" />
              {streak} streak
            </span>
          ) : null}
        </div>
      ) : streak > 0 ? (
        <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
          <Flame className="size-3" />
          {streak}
        </span>
      ) : null}
    </div>
  );
}
