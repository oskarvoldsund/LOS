import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMealsForWeek, sumNutrition } from "@/lib/services/diet";
import { isoWeekStart } from "@/lib/services/weekly-plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealCard } from "@/components/diet/meal-card";
import { NewMealDialog } from "@/components/diet/new-meal-dialog";
import { formatWeekRange } from "@/lib/format";

export default async function DietPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStartDate = week ?? isoWeekStart();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meals = await getMealsForWeek(supabase, user.id, weekStartDate);
  const totals = sumNutrition(meals);
  const daysWithMeals = new Set(meals.map((m) => m.meal_date)).size || 1;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${weekStartDate}T00:00:00`);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const prevWeek = shiftWeek(weekStartDate, -7);
  const nextWeek = shiftWeek(weekStartDate, 7);
  const today = new Date().toDateString();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Diet</h1>
          <p className="text-sm text-muted-foreground">{formatWeekRange(weekStartDate)}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            nativeButton={false}
            render={
              <Link href={`/diet?week=${prevWeek}`}>
                <ChevronLeft className="size-4" />
              </Link>
            }
          />
          <Button
            size="icon"
            variant="ghost"
            nativeButton={false}
            render={
              <Link href={`/diet?week=${nextWeek}`}>
                <ChevronRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/diet?week=${isoWeekStart()}`}>This week</Link>}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Calories" value={String(totals.calories)} />
        <StatCard label="Protein (g)" value={String(Math.round(totals.proteinG))} />
        <StatCard label="Carbs (g)" value={String(Math.round(totals.carbsG))} />
        <StatCard label="Fat (g)" value={String(Math.round(totals.fatG))} />
      </div>
      <p className="-mt-4 text-xs text-muted-foreground">
        ~{Math.round(totals.calories / daysWithMeals)} kcal/day averaged over {daysWithMeals} logged day
        {daysWithMeals === 1 ? "" : "s"}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {days.map((day) => {
          const dayMeals = meals.filter((m) => m.meal_date === day);
          const isToday = new Date(`${day}T00:00:00`).toDateString() === today;
          const label = new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
          });
          return (
            <div key={day} className="flex flex-col gap-1.5">
              <div
                className={
                  isToday
                    ? "rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                    : "px-2 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {label}
              </div>
              <div className="flex flex-col gap-1.5">
                {dayMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
                <NewMealDialog date={day} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function shiftWeek(weekStartDate: string, deltaDays: number): string {
  const d = new Date(`${weekStartDate}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-3">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
