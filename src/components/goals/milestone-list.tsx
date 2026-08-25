"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toggleMilestone, createMilestone } from "@/lib/actions/goals";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types";

export function MilestoneList({ goalId, milestones }: { goalId: string; milestones: Tables<"goal_milestones">[] }) {
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function addMilestone() {
    const title = newTitle.trim();
    if (!title) return;
    startTransition(async () => {
      await createMilestone(goalId, title);
      setNewTitle("");
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {milestones.map((milestone) => (
        <label
          key={milestone.id}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/50"
        >
          <Checkbox
            checked={milestone.status === "done"}
            onCheckedChange={(checked) =>
              startTransition(() => {
                void toggleMilestone(goalId, milestone.id, checked === true);
              })
            }
          />
          <span className={cn(milestone.status === "done" && "text-muted-foreground line-through")}>
            {milestone.title}
          </span>
        </label>
      ))}
      <div className="flex items-center gap-2 px-2 pt-1">
        <Plus className="size-3.5 text-muted-foreground" />
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMilestone()}
          placeholder="Add a milestone…"
          className="h-8 border-none px-0 text-sm shadow-none focus-visible:ring-0"
        />
        <Button size="sm" variant="ghost" disabled={pending || !newTitle.trim()} onClick={addMilestone}>
          Add
        </Button>
      </div>
    </div>
  );
}
