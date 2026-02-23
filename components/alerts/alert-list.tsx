"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Pencil, Trash2 } from "lucide-react";
import type { Alert } from "@/lib/supabase";
import { AlertForm } from "./alert-form";

const COMPARATOR_LABELS: Record<Alert["comparator"], string> = {
  GT: ">",
  GTE: "≥",
  LT: "<",
  LTE: "≤",
  EQ: "=",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AlertList({
  alerts,
  onAlertsChange,
}: {
  alerts: Alert[];
  onAlertsChange?: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Alert | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Delete failed");
      } else {
        router.refresh();
        onAlertsChange?.();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <Card className="rounded-xl border border-border/60 bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-foreground">No alerts yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Create an alert to get notified when a metric crosses your threshold.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className="rounded-xl border border-border/60 bg-card shadow-sm"
        >
          <CardHeader className="pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">
                  {alert.metric_name}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {COMPARATOR_LABELS[alert.comparator]} {alert.threshold}
                  {alert.cooldown_seconds > 0 && (
                    <span className="text-muted-foreground/80">
                      {" "}· cooldown {alert.cooldown_seconds}s
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditing(editing?.id === alert.id ? null : alert)}
                  aria-label="Edit alert"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(alert.id)}
                  disabled={deletingId === alert.id}
                  aria-label="Delete alert"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground text-red-400">{alert.message}</p>
            {alert.last_triggered_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Last triggered: {formatDate(alert.last_triggered_at)}
              </p>
            )}
          </CardContent>
          {editing?.id === alert.id && (
            <CardContent className="border-t pt-4">
              <AlertForm
                key={editing.id}
                alert={editing}
                onSuccess={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
