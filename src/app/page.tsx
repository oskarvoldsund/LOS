import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/today");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Life OS</h1>
          <p className="text-balance text-sm text-muted-foreground">
            One private portal for what matters today, this week, and where
            you&apos;re headed — with Claude helping you think and plan.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button size="lg" nativeButton={false} render={<Link href="/login">Sign in</Link>} />
          <Button
            size="lg"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/signup">Create account</Link>}
          />
        </div>
      </div>
    </div>
  );
}
