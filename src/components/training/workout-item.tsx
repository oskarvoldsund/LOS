"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeWorkout } from "@/lib/actions/training";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types";

export function WorkoutItem({ workout }: { workout: Tables<"workouts"> }) {
  const [pending, startTransition] = useTransition();
  const planned = workout.status === "planned";

  return (
    <Link
      href={`/training/${workout.id}`}
      className={cn("flex items-center gap-3 rounded-md px-2 py-2 hover:bg-secondary/50", pending && "opacity-60")}
    >
      <Badge variant="secondary" className="w-24 shrink-0 justify-center capitalize">
        {workout.activity_type}
      </Badge>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">
          {workout.distance_km ? `${workout.distance_km} km` : ""}
          {workout.distance_km && workout.duration_minutes ? " · " : ""}
          {workout.duration_minutes ? `${workout.duration_minutes} min` : ""}
          {!workout.distance_km && !workout.duration_minutes ? (workout.notes ?? "Workout") : ""}
        </span>
        {workout.notes && (workout.distance_km || workout.duration_minutes) ? (
          <span className="truncate text-xs text-muted-foreground">{workout.notes}</span>
        ) : null}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDueDate(workout.scheduled_date ?? workout.completed_at?.slice(0, 10) ?? null)}
      </span>
      {planned ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(() => {
              void completeWorkout(workout.id);
            });
          }}
        >
          <Check className="size-4" />
        </Button>
      ) : (
        <Check className="size-4 shrink-0 text-emerald-500" />
      )}
    </Link>
  );
}
