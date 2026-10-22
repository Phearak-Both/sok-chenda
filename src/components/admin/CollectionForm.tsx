"use client";

import { saveCollection } from "@/app/admin/actions/catalog";
import { useI18n } from "@/i18n/client";
import type { Collection } from "@/lib/types";
import { ActionForm, BilingualField, Checkbox, FormBanner, Section, SubmitButton, TextField } from "./fields";
import { ImageField } from "./images";

export function CollectionForm({ collection }: { collection: Collection | null }) {
  const { t } = useI18n();
  const c = t.admin.collections;
  return (
    <ActionForm action={saveCollection} className="space-y-6">
      {(state) => (
        <>
          {collection && <input type="hidden" name="id" value={collection.id} />}
          <FormBanner state={state} />
          <Section title={c.name}>
            <BilingualField name="name" label={c.name} defaultValue={collection?.name} error={state.errors?.name} maxLength={120} />
            <BilingualField name="description" label={c.description} defaultValue={collection?.description} multiline rows={3} />
            <ImageField name="image_id" label={c.image} initial={collection?.image ?? null} />
          </Section>
          <Section title={t.admin.products.sectionStatus}>
            <Checkbox name="is_published" label={c.visible} defaultChecked={collection?.isPublished ?? true} />
            <TextField name="slug" label={t.admin.common.slug} defaultValue={collection?.slug} hint={t.admin.common.slugHelp} optional />
            <TextField
              name="sort"
              type="number"
              label={t.admin.common.sort}
              defaultValue={collection?.sort ?? 0}
              hint={t.admin.common.sortHelp}
              className="max-w-[10rem]"
            />
          </Section>
          <div className="flex justify-end">
            <SubmitButton>{collection ? t.admin.common.save : t.admin.common.create}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
