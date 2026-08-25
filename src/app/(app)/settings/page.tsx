import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/services/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "@/components/settings/category-manager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const categories = await getCategories(supabase, user.id);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Your data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Business data (tasks, goals, training, calendar) and AI conversation history export
            separately, so you can keep one without the other.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<a href="/api/export/business">Export data (JSON)</a>}
            />
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<a href="/api/export/ai">Export AI history (JSON)</a>}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
