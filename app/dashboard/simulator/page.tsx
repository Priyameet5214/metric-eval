import { Suspense } from "react";
import { Activity } from "lucide-react";

function SimulatorContent() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-8 text-card-foreground shadow-sm">
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <Activity className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Metric simulation</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Simulate values to test your alert rules. Content will go here.
          </p>
        </div>
      </div>
    </div>
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
