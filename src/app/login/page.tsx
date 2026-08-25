import Link from "next/link";
import { AuthForm } from "@/components/shell/auth-form";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your Life OS.</p>
        </div>
        <AuthForm action={signIn} submitLabel="Sign in" />
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
