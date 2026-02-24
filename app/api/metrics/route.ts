import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  Alert,
  MetricPayload,
  MetricIngestResponse,
} from "@/lib/supabase";
import { evaluateComparator, isCooldownActive } from "@/lib/AlertEngine";

function validateBody(
  body: unknown
): { ok: true; data: MetricPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const o = body as Record<string, unknown>;
  const metric_name =
    typeof o.metric_name === "string" ? o.metric_name.trim() : "";
  const value =
    typeof o.value === "number" ? o.value : Number(o.value ?? NaN);
  const rawTimestamp = o.timestamp;

  if (!metric_name) {
    return { ok: false, error: "metric_name is required" };
  }
  if (Number.isNaN(value)) {
    return { ok: false, error: "value must be a number" };
  }

  let timestamp: string | undefined;
  if (rawTimestamp !== undefined && rawTimestamp !== null && rawTimestamp !== "") {
    const tsString = String(rawTimestamp);
    const parsed = new Date(tsString);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "timestamp must be a valid ISO timestamp" };
    }
    timestamp = parsed.toISOString();
  }

  return {
    ok: true,
    data: {
      metric_name,
      value,
      timestamp,
    },
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { metric_name, value, timestamp } = validated.data;
  const eventTimestamp = timestamp ?? new Date().toISOString();

  const { error: metricInsertError } = await supabase.from("metrics").insert({
    user_id: user.id,
    metric_name,
    value,
    recorded_at: eventTimestamp,
  });

  if (metricInsertError) {
    console.error("Metric insert error:", metricInsertError);
    return NextResponse.json(
      { error: metricInsertError.message },
      { status: 500 }
    );
  }

  const { data: alerts, error: alertsError } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .ilike("metric_name", metric_name);

  if (alertsError) {
    console.error("Alerts fetch error:", alertsError);
    return NextResponse.json(
      { error: alertsError.message },
      { status: 500 }
    );
  }

  let evaluated = 0;
  let triggered = 0;
  let cooldown_skipped = 0;
  const triggered_alerts: MetricIngestResponse["triggered_alerts"] = [];

  for (const alert of (alerts ?? []) as Alert[]) {
    evaluated += 1;

    if (isCooldownActive(alert.last_triggered_at, alert.cooldown_seconds)) {
      cooldown_skipped += 1;
      continue;
    }

    const passed = evaluateComparator(value, alert.threshold, alert.comparator);
    if (!passed) continue;

    const { error: eventInsertError } = await supabase
      .from("alert_events")
      .insert({
        user_id: user.id,
        alert_id: alert.id,
        metric_name,
        metric_value: value,
        timestamp: eventTimestamp,
        alert_message: alert.message,
      });

    if (eventInsertError) {
      console.error("Alert event insert error:", eventInsertError);
      return NextResponse.json(
        { error: eventInsertError.message },
        { status: 500 }
      );
    }

    const { error: alertUpdateError } = await supabase
      .from("alerts")
      .update({
        last_triggered_at: eventTimestamp,
        updated_at: eventTimestamp,
      })
      .eq("id", alert.id)
      .eq("user_id", user.id);

    if (alertUpdateError) {
      console.error("Alert update error:", alertUpdateError);
      return NextResponse.json(
        { error: alertUpdateError.message },
        { status: 500 }
      );
    }

    triggered += 1;
    triggered_alerts.push({
      id: alert.id,
      metric_name: alert.metric_name,
      message: alert.message,
    });
  }

  const response: MetricIngestResponse = {
    message: "Metric processed",
    evaluated,
    triggered,
    cooldown_skipped,
    triggered_alerts,
  };

  return NextResponse.json(response);
}

