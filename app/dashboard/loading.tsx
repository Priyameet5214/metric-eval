export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted/80 animate-pulse" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-8 animate-pulse">
        <div className="h-4 w-48 rounded-md bg-muted" />
        <div className="mt-4 h-3 w-72 rounded bg-muted/80" />
        <div className="mt-6 h-24 rounded-lg bg-muted/60" />
      </div>
    </div>
  );
}
