import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Alert, CreateAlertPayload } from "@/lib/supabase";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Alerts fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: (alerts ?? []) as Alert[] });
}

function validateBody(body: unknown): { ok: true; data: CreateAlertPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const o = body as Record<string, unknown>;
  const metric_name = typeof o.metric_name === "string" ? o.metric_name.trim() : "";
  const threshold = typeof o.threshold === "number" ? o.threshold : Number(o.threshold);
  const comparator = o.comparator;
  const message = typeof o.message === "string" ? o.message.trim() : "";
  const cooldown_seconds = o.cooldown_seconds !== undefined ? Number(o.cooldown_seconds) : 0;

  if (!metric_name) return { ok: false, error: "metric_name is required" };
  if (Number.isNaN(threshold)) return { ok: false, error: "threshold must be a number" };
  const validComparators = ["GT", "LT", "GTE", "LTE", "EQ"] as const;
  if (!validComparators.includes(comparator as typeof validComparators[number])) {
    return { ok: false, error: "comparator must be one of GT, LT, GTE, LTE, EQ" };
  }
  if (!message) return { ok: false, error: "message is required" };
  if (Number.isNaN(cooldown_seconds) || cooldown_seconds < 0) {
    return { ok: false, error: "cooldown_seconds must be 0 or a positive number" };
  }

  return {
    ok: true,
    data: {
      metric_name,
      threshold,
      comparator: comparator as CreateAlertPayload["comparator"],
      message,
      cooldown_seconds,
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

  const { data: alert, error } = await supabase
    .from("alerts")
    .insert({
      user_id: user.id,
      metric_name: validated.data.metric_name,
      threshold: validated.data.threshold,
      comparator: validated.data.comparator,
      message: validated.data.message,
      cooldown_seconds: validated.data.cooldown_seconds,
    })
    .select()
    .single();

  if (error) {
    console.error("Alert create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: alert as Alert }, { status: 201 });
}
