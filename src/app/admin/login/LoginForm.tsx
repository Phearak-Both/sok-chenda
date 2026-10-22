"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions/auth";
import { useI18n } from "@/i18n/client";

export function LoginForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(login, {});
  const l = t.admin.login;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="field-label">
          {l.email}
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          {l.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      {state.message && (
        <p role="alert" className="rounded-md bg-[#fbeeeb] px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="abtn abtn-primary w-full !min-h-12">
        {pending ? l.submitting : l.submit}
      </button>
    </form>
  );
}
