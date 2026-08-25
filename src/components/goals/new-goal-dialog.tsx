"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGoal } from "@/lib/actions/goals";
import { toast } from "sonner";
import type { GoalCheckFrequency, GoalType, Tables } from "@/lib/types";

export function NewGoalDialog({ categories = [] }: { categories?: Tables<"categories">[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("quarterly");
  const [checkFrequency, setCheckFrequency] = useState<GoalCheckFrequency>("none");
  const [categoryId, setCategoryId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await createGoal({
          title: title.trim(),
          whyItMatters: whyItMatters.trim() || undefined,
          goalType,
          checkFrequency,
          categoryId: categoryId || undefined,
        });
        setTitle("");
        setWhyItMatters("");
        setCheckFrequency("none");
        setCategoryId("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't create goal.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            New goal
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New goal</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-title">Title</Label>
            <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run a half marathon" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-type">Timeframe</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
              <SelectTrigger id="goal-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="life">Life</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {categories.length ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-category">Category</Label>
              <Select
                value={categoryId || "__none__"}
                onValueChange={(v) => setCategoryId(v && v !== "__none__" ? v : "")}
              >
                <SelectTrigger id="goal-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-cadence">Check-in</Label>
            <Select value={checkFrequency} onValueChange={(v) => setCheckFrequency(v as GoalCheckFrequency)}>
              <SelectTrigger id="goal-cadence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No check-in — milestones only</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adds a checkbox and streak tracking for a recurring habit-style goal.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-why">Why it matters</Label>
            <Textarea
              id="goal-why"
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
              placeholder="So Claude can tell whether your week actually supports this."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !title.trim()}>
            {pending ? "Creating…" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
