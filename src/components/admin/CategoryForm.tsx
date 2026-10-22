"use client";

import { saveCategory } from "@/app/admin/actions/catalog";
import { useI18n } from "@/i18n/client";
import type { Category } from "@/lib/types";
import { ActionForm, BilingualField, FormBanner, SubmitButton, TextField } from "./fields";

export function CategoryForm({ category }: { category: Category | null }) {
  const { t } = useI18n();
  return (
    <ActionForm action={saveCategory} className="space-y-4" resetOnSuccess={!category}>
      {(state) => (
        <>
          {category && <input type="hidden" name="id" value={category.id} />}
          <BilingualField
            name="name"
            label={t.admin.categories.name}
            defaultValue={category?.name}
            error={state.errors?.name}
            maxLength={80}
          />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <TextField name="slug" label={t.admin.common.slug} defaultValue={category?.slug} optional />
            <TextField name="sort" type="number" label={t.admin.common.sort} defaultValue={category?.sort ?? 0} />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="mr-auto">
              <FormBanner state={state} />
            </div>
            <SubmitButton className={category ? "abtn" : "abtn abtn-primary"}>
              {category ? t.admin.common.save : t.admin.common.create}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
