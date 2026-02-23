import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 bg-gradient-to-b from-muted/30 to-background">
      <main className="w-full max-w-lg mx-auto text-center space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/20">
            Real-time monitoring
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            MetricGuard
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
            Real-time metric monitoring and alerting.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="min-w-[140px]">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[140px]">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
