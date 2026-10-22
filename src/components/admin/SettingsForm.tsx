"use client";

import { saveSettings } from "@/app/admin/actions/settings";
import { useI18n } from "@/i18n/client";
import type { StoreSettings } from "@/lib/settings";
import { ActionForm, BilingualField, FormBanner, Section, SubmitButton, TextField } from "./fields";

export function SettingsForm({ store }: { store: StoreSettings }) {
  const { t } = useI18n();
  const s = t.admin.settings;
  return (
    <ActionForm action={saveSettings} className="space-y-6 pb-20 lg:pb-0">
      {(state) => {
        const err = state.errors ?? {};
        return (
          <>
            <FormBanner state={state} />
            <Section title={s.contact}>
              <div className="grid gap-5 md:grid-cols-2">
                <TextField name="phone" label={s.phone} defaultValue={store.phone} hint={s.phoneHint} error={err.phone} type="tel" autoComplete="tel" optional />
                <TextField
                  name="whatsapp"
                  label={s.whatsapp}
                  defaultValue={store.whatsapp ? `+${store.whatsapp}` : ""}
                  hint={s.whatsappHint}
                  error={err.whatsapp}
                  type="tel"
                  optional
                />
                <TextField name="telegram" label={s.telegram} defaultValue={store.telegram} hint={s.telegramHint} error={err.telegram} optional />
                <TextField name="email" label={s.email} defaultValue={store.email} error={err.email} type="email" optional />
              </div>
            </Section>

            <Section title={s.location}>
              <BilingualField name="address" label={s.address} defaultValue={store.address} multiline rows={3} maxLength={500} />
              <BilingualField name="hours" label={s.hours} defaultValue={store.hours} multiline rows={3} maxLength={500} />
              <TextField name="mapUrl" label={s.mapUrl} defaultValue={store.mapUrl} hint={s.mapUrlHint} error={err.mapUrl} type="url" optional />
            </Section>

            <Section title={s.social}>
              <TextField name="facebook" label={s.facebook} defaultValue={store.facebook} error={err.facebook} type="url" placeholder="https://facebook.com/…" optional />
              <TextField name="instagram" label={s.instagram} defaultValue={store.instagram} error={err.instagram} type="url" placeholder="https://instagram.com/…" optional />
              <TextField name="tiktok" label={s.tiktok} defaultValue={store.tiktok} error={err.tiktok} type="url" placeholder="https://tiktok.com/@…" optional />
            </Section>

            <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:static lg:rounded-xl lg:border lg:bg-white lg:px-5">
              <SubmitButton>{t.admin.common.save}</SubmitButton>
            </div>
          </>
        );
      }}
    </ActionForm>
  );
}
