"use client";

import { Suspense, useEffect, useState } from "react";
import { Activity, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MetricIngestResponse } from "@/lib/supabase";

function SimulatorContent() {
  const [metricName, setMetricName] = useState("");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MetricIngestResponse | null>(null);
  const [triggeredAlerts, setTriggeredAlerts] = useState<
    MetricIngestResponse["triggered_alerts"]
  >([]);

  useEffect(() => {
    if (!triggeredAlerts.length) return;
    const timer = setTimeout(() => {
      setTriggeredAlerts([]);
    }, 5000);
    return () => clearTimeout(timer);
  }, [triggeredAlerts]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = metricName.trim();
    const trimmedValue = value.trim();

    if (!trimmedName) {
      setError("Metric name is required.");
      setResult(null);
      return;
    }

    const numericValue = Number(trimmedValue);
    if (!trimmedValue || Number.isNaN(numericValue)) {
      setError("Value must be a valid number.");
      setResult(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const payload: Record<string, unknown> = {
      metric_name: trimmedName,
      value: numericValue,
    };

    try {
      const response = await fetch("/api/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Failed to send metric.");
        setTriggeredAlerts([]);
        return;
      }

      const typed = data as MetricIngestResponse;
      setResult(typed);
      setTriggeredAlerts(typed.triggered_alerts ?? []);
      setValue("");
    } catch {
      setError("Something went wrong while sending the metric.");
      setTriggeredAlerts([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {triggeredAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {triggeredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex max-w-sm items-start gap-3 rounded-md border border-destructive/70 bg-destructive/90 p-3 text-destructive-foreground shadow-lg"
            >
              <div className="flex-1">
                <p className="text-xs font-medium">
                  Alert triggered for <span className="font-semibold">{alert.metric_name}</span>
                </p>
                <p className="mt-1 text-xs opacity-90">
                  {alert.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTriggeredAlerts((prev) =>
                    prev.filter((a) => a.id !== alert.id)
                  )
                }
                aria-label="Dismiss alert"
                className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Card className="border-border/60 bg-card text-card-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-full bg-muted p-3">
            <Activity
              className="h-6 w-6 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <CardTitle className="text-base">Metric simulation</CardTitle>
            <CardDescription>
              Inject a metric value to test how your alert rules respond.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="metric-name">Metric name</Label>
              <Input
                id="metric-name"
                placeholder="e.g. cpu_usage"
                value={metricName}
                onChange={(event) => setMetricName(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="metric-value">Value</Label>
              <Input
                id="metric-value"
                type="number"
                placeholder="e.g. 82.5"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {result && (
              <div className="space-y-2 rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{result.message}</p>
                <p>Evaluated alerts: {result.evaluated}</p>
                <p>Triggered alerts: {result.triggered}</p>
                <p>Skipped (cooldown): {result.cooldown_skipped}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send metric"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function SimulatorLoading() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-8 animate-pulse">
      <div className="h-5 w-52 rounded-md bg-muted" />
      <div className="mt-4 h-3 w-72 rounded bg-muted" />
      <div className="mt-6 h-24 rounded-lg bg-muted/80" />
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Alert Simulator
        </h1>
        <p className="text-muted-foreground text-sm">
          Simulate metric values to test your alert rules.
        </p>
      </div>
      <Suspense fallback={<SimulatorLoading />}>
        <SimulatorContent />
      </Suspense>
    </div>
  );
}
