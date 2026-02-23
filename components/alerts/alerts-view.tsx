"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Alert } from "@/lib/supabase";
import { AlertForm } from "./alert-form";
import { AlertList } from "./alert-list";

export function AlertsView({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {showCreate ? (
          <AlertForm
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <Button onClick={() => setShowCreate(true)} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Add alert
          </Button>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight">Your alerts</h2>
        <AlertList alerts={initialAlerts} />
      </div>
    </div>
  );
}
