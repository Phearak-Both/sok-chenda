"use client";

import { changePassword } from "@/app/admin/actions/auth";
import { useI18n } from "@/i18n/client";
import { ActionForm, FormBanner, SubmitButton, TextField } from "./fields";

export function PasswordForm() {
  const { t } = useI18n();
  const a = t.admin.account;
  return (
    <ActionForm action={changePassword} className="space-y-4" resetOnSuccess>
      {(state) => (
        <>
          <FormBanner state={state} />
          <TextField name="current" label={a.current} type="password" autoComplete="current-password" error={state.errors?.current} />
          <TextField name="next" label={a.next} type="password" autoComplete="new-password" error={state.errors?.next} />
          <TextField name="confirm" label={a.confirm} type="password" autoComplete="new-password" error={state.errors?.confirm} />
          <SubmitButton>{a.changePassword}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
