"use client";

import { Dumbbell, ListPlus, NotebookPen, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogWorkoutDialog } from "@/components/training/log-workout-dialog";
import { NewMealDialog } from "@/components/diet/new-meal-dialog";
import { NewDiaryEntryDialog } from "@/components/diary/new-diary-entry-dialog";

/**
 * The single quick-capture bar at the very top of Home — training, food,
 * todos, and diary, in one row. "Todo" reuses the existing global Cmd+K
 * modal (dispatches the same synthetic keydown it listens for) rather than
 * a second task-creation UI.
 */
export function QuickAddBar({ today }: { today: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <LogWorkoutDialog
        trigger={
          <Button variant="outline" className="w-full gap-1.5">
            <Dumbbell className="size-4" />
            Training
          </Button>
        }
      />
      <NewMealDialog
        date={today}
        trigger={
          <Button variant="outline" className="w-full gap-1.5">
            <UtensilsCrossed className="size-4" />
            Food
          </Button>
        }
      />
      <Button
        variant="outline"
        className="w-full gap-1.5"
        onClick={() => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
        }}
      >
        <ListPlus className="size-4" />
        Todo
      </Button>
      <NewDiaryEntryDialog
        date={today}
        trigger={
          <Button variant="outline" className="w-full gap-1.5">
            <NotebookPen className="size-4" />
            Diary
          </Button>
        }
      />
    </div>
  );
}
