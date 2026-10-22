"use client";

import { saveProduct } from "@/app/admin/actions/products";
import { useI18n } from "@/i18n/client";
import { METAL_TYPES, metalLabel } from "@/lib/metal";
import { PRODUCT_STATUSES, type Product } from "@/lib/types";
import { EyeIcon } from "../icons";
import { ActionForm, BilingualField, Checkbox, FormBanner, Section, SelectField, SubmitButton, TextField } from "./fields";
import { PhotoManager } from "./images";
import { WeightField } from "./WeightField";

type Option = { value: number; label: string };

export function ProductForm({
  product,
  categories,
  collections,
}: {
  product: Product | null;
  categories: Option[];
  collections: Option[];
}) {
  const { t, locale } = useI18n();
  const p = t.admin.products;

  return (
    <ActionForm action={saveProduct} className="grid gap-6 pb-24 lg:grid-cols-3 lg:pb-0">
      {(state) => (
        <>
          {product && <input type="hidden" name="id" value={product.id} />}

          <div className="space-y-6 lg:col-span-2">
            <FormBanner state={state} />
            <Section title={p.sectionBasics}>
              <BilingualField name="name" label={p.name} defaultValue={product?.name} error={state.errors?.name} maxLength={200} />
              <BilingualField
                name="description"
                label={p.description}
                defaultValue={product?.description}
                multiline
                rows={6}
                hint={t.admin.content.paragraphHint}
              />
            </Section>

            <Section title={p.sectionPhotos}>
              <PhotoManager initial={product?.images ?? []} />
            </Section>

            <Section title={p.sectionDetails}>
              <SelectField
                name="metal_type"
                label={p.metalType}
                defaultValue={product?.metalType ?? ""}
                options={[{ value: "", label: p.metalNone }, ...METAL_TYPES.map((m) => ({ value: m, label: metalLabel(m, locale) }))]}
              />
              <BilingualField name="material" label={p.material} defaultValue={product?.material} hint={p.materialHint} />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title={p.sectionStatus} description={p.statusHelp}>
              {product ? (
                <fieldset>
                  <legend className="sr-only">{p.sectionStatus}</legend>
                  <div className="grid gap-2">
                    {PRODUCT_STATUSES.map((s) => (
                      <label
                        key={s}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-line px-3 has-[:checked]:border-ink has-[:checked]:bg-cream/60"
                      >
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          defaultChecked={product.status === s}
                          className="h-4 w-4 accent-[var(--color-ink)]"
                        />
                        <span className="text-sm">{p.status[s]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              <Checkbox name="featured" label={p.featuredLabel} defaultChecked={product?.isFeatured} />
              {product?.isSample && (
                <Checkbox name="is_sample" label={p.sampleLabel} hint={p.sampleLabelHint} defaultChecked />
              )}
            </Section>

            <Section title={p.sectionWeight}>
              <WeightField initialGrams={product?.weightGrams ?? null} error={state.errors?.weight} />
            </Section>

            <Section title={p.sectionOrganize}>
              <SelectField
                name="category_id"
                label={p.category}
                defaultValue={product?.categoryId ?? ""}
                options={[{ value: "", label: p.noCategory }, ...categories]}
              />
              <fieldset>
                <legend className="field-label">{p.collections}</legend>
                {collections.length === 0 ? (
                  <p className="text-sm text-ink-faint">{p.noCollections}</p>
                ) : (
                  collections.map((c) => (
                    <Checkbox
                      key={c.value}
                      name="collection_ids"
                      value={String(c.value)}
                      label={c.label}
                      defaultChecked={product?.collectionIds.includes(c.value)}
                    />
                  ))
                )}
              </fieldset>
              <TextField
                name="slug"
                label={t.admin.common.slug}
                defaultValue={product?.slug}
                hint={t.admin.common.slugHelp}
                optional
                maxLength={100}
              />
              <TextField
                name="sort"
                label={t.admin.common.sort}
                defaultValue={product?.sort ?? 0}
                type="number"
                hint={t.admin.common.sortHelp}
                className="max-w-[10rem]"
              />
            </Section>
          </div>

          {/* Save bar: fixed at the bottom on phones, inline on desktop. */}
          <div className="fixed inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:static lg:col-span-3 lg:rounded-xl lg:border lg:bg-white lg:px-5">
            {product ? (
              <>
                <a href={`/products/${product.slug}`} target="_blank" rel="noopener" className="abtn mr-auto">
                  <EyeIcon size={16} /> {p.preview}
                </a>
                <SubmitButton>{t.admin.common.save}</SubmitButton>
              </>
            ) : (
              <>
                <span className="mr-auto hidden text-xs text-ink-faint sm:block">{p.previewHint}</span>
                <SubmitButton name="intent" value="draft" className="abtn">
                  {p.saveDraft}
                </SubmitButton>
                <SubmitButton name="intent" value="publish">
                  {p.saveAndPublish}
                </SubmitButton>
              </>
            )}
          </div>
        </>
      )}
    </ActionForm>
  );
}
