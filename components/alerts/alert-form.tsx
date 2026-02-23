"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Alert, Comparator } from "@/lib/supabase";

const COMPARATORS: { value: Comparator; label: string }[] = [
  { value: "GT", label: "Greater than" },
  { value: "GTE", label: "Greater or equal" },
  { value: "LT", label: "Less than" },
  { value: "LTE", label: "Less or equal" },
  { value: "EQ", label: "Equal to" },
];

function getComparatorLabel(value: Comparator): string {
  return COMPARATORS.find((c) => c.value === value)?.label ?? value;
}

export type AlertFormErrors = Partial<Record<string, string>>;

export function AlertForm({
  alert,
  onSuccess,
  onCancel,
}: {
  alert?: Alert | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEdit = !!alert?.id;
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<AlertFormErrors | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formPreview, setFormPreview] = useState({
    metric_name: alert?.metric_name ?? "",
    comparator: (alert?.comparator ?? "GT") as Comparator,
    threshold: alert?.threshold != null ? String(alert.threshold) : "",
  });

  useEffect(() => {
    setError(null);
    setErrors(null);
  }, [alert?.id, isEdit]);

  useEffect(() => {
    if (alert) {
      setFormPreview({
        metric_name: alert.metric_name ?? "",
        comparator: alert.comparator ?? "GT",
        threshold: alert.threshold != null ? String(alert.threshold) : "",
      });
    }
  }, [alert]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setErrors(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const metric_name = (formData.get("metric_name") as string)?.trim() ?? "";
    const thresholdStr = (formData.get("threshold") as string) ?? "";
    const threshold = Number(thresholdStr);
    const comparator = (formData.get("comparator") as Comparator) ?? "GT";
    let message = (formData.get("message") as string)?.trim() ?? "";
    const cooldown_seconds = Number((formData.get("cooldown_seconds") as string) ?? "0");

    if (!message && metric_name && !Number.isNaN(threshold)) {
      message = `${metric_name} is ${getComparatorLabel(comparator)} ${threshold}`;
    }

    const fieldErrors: AlertFormErrors = {};
    if (!metric_name) fieldErrors.metric_name = "Required";
    if (Number.isNaN(threshold)) fieldErrors.threshold = "Enter a valid number";
    if (!message) fieldErrors.message = "Required";
    if (Number.isNaN(cooldown_seconds) || cooldown_seconds < 0) {
      fieldErrors.cooldown_seconds = "Enter 0 or a positive number";
    }
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    try {
      const url = isEdit && alert ? `/api/alerts/${alert.id}` : "/api/alerts";
      const method = isEdit ? "PATCH" : "POST";
      const body = {
        metric_name,
        threshold,
        comparator,
        message,
        cooldown_seconds,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        if (data.errors) setErrors(data.errors);
        return;
      }
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="rounded-xl border border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle>{isEdit ? "Edit alert" : "New alert"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update threshold and message. Alerts fire when the metric matches the rule (subject to cooldown)."
            : "Set a limit: when the metric matches the rule, an alert is triggered (optional cooldown)."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="metric_name">Metric name</Label>
              <Input
                id="metric_name"
                name="metric_name"
                placeholder="e.g. cpu_usage"
                defaultValue={alert?.metric_name ?? ""}
                onChange={(e) =>
                  setFormPreview((p) => ({ ...p, metric_name: e.target.value }))
                }
                className={errors?.metric_name ? "border-destructive" : ""}
              />
              {errors?.metric_name && (
                <p className="text-xs text-destructive">{errors.metric_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                name="threshold"
                type="number"
                step="any"
                placeholder="e.g. 90"
                defaultValue={alert?.threshold ?? ""}
                onChange={(e) =>
                  setFormPreview((p) => ({ ...p, threshold: e.target.value }))
                }
                className={errors?.threshold ? "border-destructive" : ""}
              />
              {errors?.threshold && (
                <p className="text-xs text-destructive">{errors.threshold}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comparator">Comparator</Label>
              <Select
                id="comparator"
                name="comparator"
                defaultValue={alert?.comparator ?? "GT"}
                onChange={(e) =>
                  setFormPreview((p) => ({
                    ...p,
                    comparator: e.target.value as Comparator,
                  }))
                }
                className={errors?.comparator ? "border-destructive" : ""}
              >
                {COMPARATORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cooldown_seconds">Cooldown (seconds)</Label>
              <Input
                id="cooldown_seconds"
                name="cooldown_seconds"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={alert?.cooldown_seconds ?? "0"}
                className={errors?.cooldown_seconds ? "border-destructive" : ""}
              />
              {errors?.cooldown_seconds && (
                <p className="text-xs text-destructive">
                  {errors.cooldown_seconds}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Alert message</Label>
            <Input
              id="message"
              name="message"
              placeholder={`${formPreview.metric_name || "(metric name)"} is ${getComparatorLabel(formPreview.comparator)} ${formPreview.threshold !== "" ? formPreview.threshold : "(threshold)"}`}
              defaultValue={alert?.message ?? ""}
              className={errors?.message ? "border-destructive" : ""}
            />
            {errors?.message && (
              <p className="text-xs text-destructive">{errors.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
            {isEdit && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
