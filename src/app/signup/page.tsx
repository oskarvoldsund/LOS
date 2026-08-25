import Link from "next/link";
import { AuthForm } from "@/components/shell/auth-form";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Create your Life OS</h1>
          <p className="text-sm text-muted-foreground">Personal, private, yours.</p>
        </div>
        <AuthForm action={signUp} submitLabel="Create account" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
