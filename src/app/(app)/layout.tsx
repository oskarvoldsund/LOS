import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/nav";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { QuickAdd } from "@/components/shell/quick-add";
import { QuickAddTrigger } from "@/components/shell/quick-add-trigger";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/20 px-3 py-4 md:flex">
        <div className="px-2 pb-4 text-sm font-semibold tracking-tight">Life OS</div>
        <SidebarNav items={PRIMARY_NAV} />
        <div className="mt-6 border-t pt-4">
          <SidebarNav items={SECONDARY_NAV} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <QuickAddTrigger />
          <UserMenu email={user.email ?? ""} />
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">{children}</main>
      </div>

      <QuickAdd />
    </div>
  );
}
