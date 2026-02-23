"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-border/60 bg-card p-10 text-center max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        An error occurred loading this page. You can try again.
      </p>
      <Button variant="outline" onClick={reset} className="min-w-[120px]">
        Try again
      </Button>
    </div>
  );
}
