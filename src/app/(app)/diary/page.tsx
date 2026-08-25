import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasDiaryPin } from "@/lib/services/diary-lock";
import { getAllDiaryEntries } from "@/lib/services/diary";
import { SetDiaryPinForm } from "@/components/diary/set-diary-pin-form";
import { UnlockDiaryForm } from "@/components/diary/unlock-diary-form";
import { LockDiaryButton } from "@/components/diary/lock-diary-button";

const UNLOCK_COOKIE = "diary_unlocked";

export default async function DiaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pinIsSet = await hasDiaryPin(supabase, user.id);
  if (!pinIsSet) {
    return <SetDiaryPinForm />;
  }

  const cookieStore = await cookies();
  const unlocked = cookieStore.get(UNLOCK_COOKIE)?.value === "1";
  if (!unlocked) {
    return <UnlockDiaryForm />;
  }

  const entries = await getAllDiaryEntries(supabase, user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Diary</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <LockDiaryButton />
      </div>

      {entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nothing written yet — use the Diary quick-add on Home.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {entries.map((entry) => (
            <article key={entry.id} className="flex flex-col gap-1.5 border-b pb-6 last:border-0">
              <h2 className="text-sm font-medium text-muted-foreground">
                {new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
