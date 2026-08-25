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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWorkout } from "@/lib/actions/training";
import { toast } from "sonner";
import type { ActivityType } from "@/lib/types";
import { ACTIVITY_TYPES } from "@/lib/training-constants";

export function NewWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("running");
  const [date, setDate] = useState("");
  const [distance, setDistance] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        await createWorkout({
          activityType,
          scheduledDate: date || undefined,
          distanceKm: distance ? Number(distance) : undefined,
        });
        setDate("");
        setDistance("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add workout.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Plan workout
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan a workout</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Activity</Label>
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((a) => (
                  <SelectItem key={a} value={a} className="capitalize">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workout-date">Date</Label>
              <Input id="workout-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workout-distance">Distance (km)</Label>
              <Input
                id="workout-distance"
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Adding…" : "Add to plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
