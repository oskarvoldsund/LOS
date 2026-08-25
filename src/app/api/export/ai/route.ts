import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportAiHistory } from "@/lib/services/export";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const data = await exportAiHistory(supabase, user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="life-os-ai-history-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
