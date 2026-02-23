import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/metric-names
 * Returns distinct metric names for the current user (from metrics and alerts).
 * Query param: q (optional) - filter names that contain this string (case-insensitive).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") ?? "").trim().toLowerCase();

  const namesSet = new Set<string>();

  // From metrics table (limit to avoid huge result sets; we only need distinct names)
  const { data: metricsRows } = await supabase
    .from("metrics")
    .select("metric_name")
    .eq("user_id", user.id)
    .limit(5000);

  if (metricsRows) {
    for (const row of metricsRows as { metric_name: string }[]) {
      if (row.metric_name) namesSet.add(row.metric_name);
    }
  }

  // From alerts table (existing alert metric names)
  const { data: alertsRows } = await supabase
    .from("alerts")
    .select("metric_name")
    .eq("user_id", user.id);

  if (alertsRows) {
    for (const row of alertsRows as { metric_name: string }[]) {
      if (row.metric_name) namesSet.add(row.metric_name);
    }
  }

  let names = Array.from(namesSet).sort();

  if (search) {
    names = names.filter((name) =>
      name.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ names });
}
