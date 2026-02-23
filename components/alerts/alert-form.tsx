"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { getMetricNames } from "@/lib/metrics";
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
  const [metricSuggestions, setMetricSuggestions] = useState<string[]>([]);
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [loadingMetricNames, setLoadingMetricNames] = useState(false);
  const metricDropdownRef = useRef<HTMLDivElement>(null);
  const metricSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMetricSuggestions = useCallback(async (search: string) => {
    setLoadingMetricNames(true);
    try {
      const names = await getMetricNames(search || undefined);
      setMetricSuggestions(names);
      setMetricDropdownOpen(true);
    } catch {
      setMetricSuggestions([]);
    } finally {
      setLoadingMetricNames(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        metricDropdownRef.current &&
        !metricDropdownRef.current.contains(e.target as Node)
      ) {
        setMetricDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            <div className="space-y-2" ref={metricDropdownRef}>
              <Label htmlFor="metric_name">Metric name</Label>
              <div className="relative">
                <Input
                  id="metric_name"
                  name="metric_name"
                  placeholder="e.g. cpu_usage"
                  value={formPreview.metric_name}
                  autoComplete="off"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormPreview((p) => ({ ...p, metric_name: value }));
                    if (metricSearchTimeoutRef.current) {
                      clearTimeout(metricSearchTimeoutRef.current);
                    }
                    metricSearchTimeoutRef.current = setTimeout(() => {
                      fetchMetricSuggestions(value);
                      metricSearchTimeoutRef.current = null;
                    }, 200);
                  }}
                  onFocus={() => fetchMetricSuggestions(formPreview.metric_name)}
                  className={errors?.metric_name ? "border-destructive" : ""}
                />
                {metricDropdownOpen && (
                  <ul
                    className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-input bg-popover py-1 text-sm shadow-md"
                    role="listbox"
                  >
                    {loadingMetricNames ? (
                      <li className="px-3 py-2 text-muted-foreground">
                        Loading…
                      </li>
                    ) : metricSuggestions.length === 0 ? (
                      <li className="px-3 py-2 text-muted-foreground">
                        No previous metrics. Type a new name.
                      </li>
                    ) : (
                      metricSuggestions.map((name) => (
                        <li
                          key={name}
                          role="option"
                          aria-selected={formPreview.metric_name === name}
                          tabIndex={0}
                          className="cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormPreview((p) => ({ ...p, metric_name: name }));
                            setMetricDropdownOpen(false);
                          }}
                        >
                          {name}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
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
