import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutWithExercises } from "@/lib/services/training";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/format";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await getWorkoutWithExercises(supabase, user.id, id);
  if (!result) notFound();
  const { workout, exercises } = result;

  const date = workout.scheduled_date ?? workout.completed_at?.slice(0, 10) ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/training" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3" />
          Training
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight capitalize">{workout.activity_type}</h1>
          <Badge variant="outline" className="capitalize">
            {workout.status}
          </Badge>
        </div>
        {date ? <p className="mt-1 text-sm text-muted-foreground">{formatDueDate(date)}</p> : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
            {workout.duration_minutes ? (
              <Detail label="Duration" value={`${workout.duration_minutes} min`} />
            ) : null}
            {workout.distance_km ? <Detail label="Distance" value={`${workout.distance_km} km`} /> : null}
            {workout.intensity ? <Detail label="Intensity" value={workout.intensity} capitalize /> : null}
            {workout.perceived_effort ? (
              <Detail label="Effort" value={`${workout.perceived_effort}/10`} />
            ) : null}
          </dl>
          {!workout.duration_minutes &&
          !workout.distance_km &&
          !workout.intensity &&
          !workout.perceived_effort ? (
            <p className="text-sm text-muted-foreground">No further detail logged.</p>
          ) : null}
        </CardContent>
      </Card>

      {exercises.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exercises</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {exercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                <span>{ex.name}</span>
                <span className="text-muted-foreground">
                  {[
                    ex.sets ? `${ex.sets} sets` : null,
                    ex.reps ? `${ex.reps} reps` : null,
                    ex.weight_kg ? `${ex.weight_kg} kg` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {workout.notes ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      {workout.goal_id ? (
        <Link
          href={`/goals/${workout.goal_id}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          View linked goal →
        </Link>
      ) : null}
    </div>
  );
}

function Detail({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={capitalize ? "capitalize" : undefined}>{value}</dd>
    </div>
  );
}
