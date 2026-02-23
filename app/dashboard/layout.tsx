import { DashboardNavbar } from "@/components/dashboard-navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh flex flex-col bg-muted/20">
      <DashboardNavbar />
      <main className="flex-1 container py-8 px-4 md:px-6">{children}</main>
    </div>
  );
}
