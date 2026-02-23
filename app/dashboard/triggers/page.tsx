import { Suspense } from "react";
import { Zap } from "lucide-react";

function TriggersContent() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-8 text-card-foreground shadow-sm">
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <Zap className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Alert events</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            View trigger history and event log. Content will go here.
          </p>
        </div>
      </div>
    </div>
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
