"use client";

import { Suspense, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AlertEvent } from "@/lib/supabase";

interface AlertEventsResponse {
  events: AlertEvent[];
  nextCursor: string | null;
  error?: string;
}

function TriggersContent() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents(cursor?: string) {
      try {
        if (cursor) {
          setIsLoadingMore(true);
        } else {
          setIsInitialLoading(true);
        }
        setError(null);

        const url = cursor
          ? `/api/alert-events?cursor=${encodeURIComponent(cursor)}`
          : "/api/alert-events";

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          if (!isMounted) return;
          setError(data?.error ?? "Failed to load alert events.");
          if (!cursor) {
            setEvents([]);
            setNextCursor(null);
          }
          return;
        }

        if (!isMounted) return;
        const { events: newEvents, nextCursor: newCursor } =
          data as AlertEventsResponse;

        setEvents((prev) =>
          cursor ? [...prev, ...(newEvents ?? [])] : newEvents ?? []
        );
        setNextCursor(newCursor ?? null);
      } catch {
        if (!isMounted) return;
        setError("Something went wrong while loading alert events.");
        if (!cursor) {
          setEvents([]);
          setNextCursor(null);
        }
      } finally {
        if (!isMounted) return;
        if (cursor) {
          setIsLoadingMore(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="border-border/60 bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="rounded-full bg-muted p-3">
          <Zap className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <CardTitle className="text-base">Alert events</CardTitle>
          <CardDescription>
            View trigger history and recent alert firings.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isInitialLoading && (
          <p className="text-sm text-muted-foreground">
            Loading alert events...
          </p>
        )}

        {!isInitialLoading && error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {!isInitialLoading && !error && events.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No alert events recorded yet. Send a metric through the simulator to
            trigger alerts and see events here.
          </p>
        )}

        {!isInitialLoading && !error && events.length > 0 && (
          <>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Metric</th>
                    <th className="py-2 pr-4 font-medium">Value</th>
                    <th className="py-2 pr-4 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 align-top">
                        <span className="font-mono text-xs">
                          {event.metric_name}
                        </span>
                      </td>
                      <td className="py-2 pr-4 align-top">
                        {event.metric_value}
                      </td>
                      <td className="py-2 pr-4 align-top text-sm">
                        {event.alert_message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {nextCursor && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoadingMore}
                  onClick={async () => {
                    if (!nextCursor || isLoadingMore) return;

                    const url = `/api/alert-events?cursor=${encodeURIComponent(
                      nextCursor
                    )}`;
                    try {
                      setIsLoadingMore(true);
                      const response = await fetch(url);
                      const data =
                        (await response.json()) as AlertEventsResponse;

                      if (!response.ok) {
                        setError(
                          (data as { error?: string })?.error ??
                            "Failed to load more alert events."
                        );
                        return;
                      }

                      setEvents((prev) => [
                        ...prev,
                        ...(data.events ?? []),
                      ]);
                      setNextCursor(data.nextCursor ?? null);
                    } catch {
                      setError(
                        "Something went wrong while loading more alert events."
                      );
                    } finally {
                      setIsLoadingMore(false);
                    }
                  }}
                >
                  {isLoadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TriggersLoading() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-8 animate-pulse">
      <div className="h-5 w-44 rounded-md bg-muted" />
      <div className="mt-4 h-3 w-72 rounded bg-muted" />
      <div className="mt-6 h-24 rounded-lg bg-muted/80" />
    </div>
  );
}

export default function TriggersPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Alert Triggers
        </h1>
        <p className="text-muted-foreground text-sm">
          View alert events and trigger history.
        </p>
      </div>
      <Suspense fallback={<TriggersLoading />}>
        <TriggersContent />
      </Suspense>
    </div>
  );
}
