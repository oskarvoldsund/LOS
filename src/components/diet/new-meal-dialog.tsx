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
import { createMeal } from "@/lib/actions/diet";
import { toast } from "sonner";

export function NewMealDialog({ date, trigger }: { date: string; trigger?: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await createMeal({
          mealDate: date,
          title: title.trim(),
          description: description.trim() || undefined,
          calories: calories ? Number(calories) : undefined,
          proteinG: protein ? Number(protein) : undefined,
          carbsG: carbs ? Number(carbs) : undefined,
          fatG: fat ? Number(fat) : undefined,
        });
        setTitle("");
        setDescription("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add meal.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant="ghost" className="h-7 w-full justify-start gap-1.5 text-muted-foreground">
              <Plus className="size-3.5" />
              Add meal
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add meal — {date}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meal-title">Meal</Label>
            <Input id="meal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Salmon, rice, greens" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meal-description">Notes</Label>
            <Textarea
              id="meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-calories">kcal</Label>
              <Input id="meal-calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-protein">Protein g</Label>
              <Input id="meal-protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-carbs">Carbs g</Label>
              <Input id="meal-carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-fat">Fat g</Label>
              <Input id="meal-fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !title.trim()}>
            {pending ? "Adding…" : "Add meal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
