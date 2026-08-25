"use client";

import { useState, useTransition } from "react";
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
import { logWorkout } from "@/lib/actions/training";
import { ACTIVITY_TYPES, DISTANCE_ACTIVITIES, INTENSITY_LEVELS } from "@/lib/training-constants";
import { toast } from "sonner";
import type { ActivityType, WorkoutIntensity } from "@/lib/types";

/**
 * Logs a session that already happened — distinct from "Plan workout" on
 * the Training page, which schedules one for later. Lives on Home for fast
 * post-workout capture.
 */
export function LogWorkoutDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("strength");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [intensity, setIntensity] = useState<WorkoutIntensity | "">("");
  const [effort, setEffort] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const showDistance = DISTANCE_ACTIVITIES.includes(activityType);

  function reset() {
    setDuration("");
    setDistance("");
    setIntensity("");
    setEffort("");
    setNotes("");
  }

  function submit() {
    startTransition(async () => {
      try {
        await logWorkout({
          activityType,
          durationMinutes: duration ? Number(duration) : undefined,
          distanceKm: distance ? Number(distance) : undefined,
          intensity: intensity || undefined,
          perceivedEffort: effort ? Number(effort) : undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Workout logged.");
        reset();
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't log that.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a workout</DialogTitle>
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
              <Label htmlFor="log-duration">Duration (min)</Label>
              <Input
                id="log-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            {showDistance ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="log-distance">Distance (km)</Label>
                <Input
                  id="log-distance"
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="log-effort">Effort (1–10)</Label>
                <Input
                  id="log-effort"
                  type="number"
                  min={1}
                  max={10}
                  value={effort}
                  onChange={(e) => setEffort(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Intensity</Label>
              <Select value={intensity} onValueChange={(v) => setIntensity(v as WorkoutIntensity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITY_LEVELS.map((i) => (
                    <SelectItem key={i} value={i} className="capitalize">
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showDistance ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="log-effort-2">Effort (1–10)</Label>
                <Input
                  id="log-effort-2"
                  type="number"
                  min={1}
                  max={10}
                  value={effort}
                  onChange={(e) => setEffort(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="log-notes">Notes</Label>
            <Textarea
              id="log-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="How it felt, what you did…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Logging…" : "Log workout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
