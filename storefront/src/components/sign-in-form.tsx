"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Problem } from "@/components/problem";
import { register, signIn, type ActionState } from "@/lib/actions";

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" {...rest} />
    </label>
  );
}

export function SignInForm() {
  const [mode, setMode] = useState<"in" | "new">("in");
  const [signInState, signInAction, signingIn] = useActionState<ActionState, FormData>(signIn, null);
  const [registerState, registerAction, registering] = useActionState<ActionState, FormData>(register, null);
  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Account" className="flex gap-6 border-b border-line">
        {(
          [
            ["in", "Sign in"],
            ["new", "Create an account"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`relative min-h-11 text-[13px] ${mode === id ? "font-semibold after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-ink" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "in" ? (
        <form action={signInAction} className="mt-7 space-y-5">
          <Field label="Email address" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <div aria-live="polite" className="empty:hidden">
            {signInState?.error && <Problem>{signInState.error}</Problem>}
          </div>
          <button type="submit" disabled={signingIn} className="btn btn-primary w-full">
            {signingIn ? "Signing in..." : "Sign in"}
            <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <form action={registerAction} className="mt-7 space-y-5">
          <Field label="Name" name="name" autoComplete="name" required />
          <Field label="Email address" name="email" type="email" autoComplete="email" required />
          <Field label="Password (at least 10 characters)" name="password" type="password" autoComplete="new-password" minLength={10} required />
          <div aria-live="polite" className="empty:hidden">
            {registerState?.error && <Problem>{registerState.error}</Problem>}
          </div>
          <button type="submit" disabled={registering} className="btn btn-primary w-full">
            {registering ? "Creating your account..." : "Create account"}
            <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
