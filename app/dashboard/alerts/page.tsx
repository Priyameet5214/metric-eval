import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Alert } from "@/lib/supabase";
import { AlertsView } from "@/components/alerts";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Alerts fetch error:", error);
  }

  const list = (alerts ?? []) as Alert[];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground text-sm">
          Manage your alert rules and thresholds. Alerts fire when metrics cross
          these limits (subject to cooldown).
        </p>
      </div>
      <AlertsView initialAlerts={list} />
    </div>
  );
}
