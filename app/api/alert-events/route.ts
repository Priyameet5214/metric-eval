import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AlertEvent } from "@/lib/supabase";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const metricName = searchParams.get("metric_name");
  const alertId = searchParams.get("alert_id");
  const rawLimit = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  let limit = 4;
  if (rawLimit) {
    const parsed = Number(rawLimit);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 500) {
      limit = parsed;
    }
  }

  const pageSize = limit;
  const queryLimit = pageSize + 1;

  let query = supabase
    .from("alert_events")
    .select("*")
    .eq("user_id", user.id)
    .order("timestamp", { ascending: false })
    .limit(queryLimit);

  if (metricName) {
    query = query.ilike("metric_name", metricName);
  }

  if (alertId) {
    query = query.eq("alert_id", alertId);
  }

  if (cursor) {
    query = query.lt("timestamp", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Alert events fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as AlertEvent[];
  const hasMore = rows.length > pageSize;
  const events = hasMore ? rows.slice(0, pageSize) : rows;
  const nextCursor =
    hasMore && events.length > 0 ? events[events.length - 1].timestamp : null;

  return NextResponse.json({ events, nextCursor, hasMore });
}

