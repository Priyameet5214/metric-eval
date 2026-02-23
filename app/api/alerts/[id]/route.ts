import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Alert, CreateAlertPayload } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: alert, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ alert: alert as Alert });
}

function validateBody(
  body: unknown
): { ok: true; data: Partial<CreateAlertPayload> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const o = body as Record<string, unknown>;
  const out: Partial<CreateAlertPayload> = {};

  if (o.metric_name !== undefined) {
    const v = typeof o.metric_name === "string" ? o.metric_name.trim() : "";
    if (!v) return { ok: false, error: "metric_name cannot be empty" };
    out.metric_name = v;
  }
  if (o.threshold !== undefined) {
    const v = typeof o.threshold === "number" ? o.threshold : Number(o.threshold);
    if (Number.isNaN(v)) return { ok: false, error: "threshold must be a number" };
    out.threshold = v;
  }
  if (o.comparator !== undefined) {
    const valid = ["GT", "LT", "GTE", "LTE", "EQ"] as const;
    if (!valid.includes(o.comparator as (typeof valid)[number])) {
      return { ok: false, error: "comparator must be one of GT, LT, GTE, LTE, EQ" };
    }
    out.comparator = o.comparator as CreateAlertPayload["comparator"];
  }
  if (o.message !== undefined) {
    const v = typeof o.message === "string" ? o.message.trim() : "";
    if (!v) return { ok: false, error: "message cannot be empty" };
    out.message = v;
  }
  if (o.cooldown_seconds !== undefined) {
    const v = Number(o.cooldown_seconds);
    if (Number.isNaN(v) || v < 0) {
      return { ok: false, error: "cooldown_seconds must be 0 or a positive number" };
    }
    out.cooldown_seconds = v;
  }

  return { ok: true, data: out };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Alert update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ alert: alert as Alert });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("alerts").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Alert delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
