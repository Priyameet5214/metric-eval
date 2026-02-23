"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  { href: "/dashboard/alerts", label: "Alerts" },
  { href: "/dashboard/simulator", label: "Alert Simulator" },
  { href: "/dashboard/triggers", label: "Alert Triggers" },
] as const;

export function DashboardNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center gap-6 ml-6">
        <Link
          href="/dashboard"
          className="font-semibold text-lg text-foreground tracking-tight hover:text-foreground/90 transition-colors"
        >
          MetricGuard
        </Link>
        <nav className="flex items-center gap-0.5 flex-1">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-md",
                  pathname === href && "font-medium bg-muted shadow-sm"
                )}
              >
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <LogoutButton variant="outline" size="sm" className="shrink-0" />
      </div>
    </header>
  );
}
