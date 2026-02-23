import { SignUpForm } from "@/components/sign-up-form";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-muted/30 to-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-foreground/90">
            MetricGuard
          </Link>
          <p className="text-xs text-muted-foreground">Create an account</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
