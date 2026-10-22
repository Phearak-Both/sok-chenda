"use client";

import { savePrices } from "@/app/admin/actions/settings";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/client";
import { METAL_TYPES, metalLabel } from "@/lib/metal";
import { unitLabel, type PriceSettings } from "@/lib/prices";
import { WEIGHT_UNITS } from "@/lib/weight";
import { ActionForm, FieldError, FormBanner, Section, SelectField, SubmitButton } from "./fields";

export function PricesForm({ prices, updated, stale }: { prices: PriceSettings; updated: string | null; stale: boolean }) {
  const { t, locale } = useI18n();
  const p = t.admin.prices;

  return (
    <ActionForm action={savePrices} className="space-y-6 pb-20 lg:pb-0">
      {(state) => {
        const err = state.errors ?? {};
        return (
          <>
            <FormBanner state={state} />
            <p className="text-sm text-ink-soft">{p.intro}</p>
            <p className={`rounded-lg border px-4 py-3 text-sm ${stale ? "border-gold/40 bg-cream" : "border-line bg-white"}`}>
              {updated ? fmt(p.lastUpdated, { date: updated }) : p.never}
              {stale && <span className="mt-1 block text-ink-soft">{p.stale}</span>}
            </p>

            <Section title={p.quote}>
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  name="currency"
                  label={p.currency}
                  defaultValue={prices.currency}
                  options={[
                    { value: "USD", label: "USD ($)" },
                    { value: "KHR", label: "KHR (៛)" },
                  ]}
                />
                <SelectField
                  name="unit"
                  label={p.unit}
                  defaultValue={prices.unit}
                  options={WEIGHT_UNITS.map((u) => ({ value: u, label: `${unitLabel(u, "km")} (${unitLabel(u, "en")})` }))}
                />
              </div>
            </Section>

            <Section title={p.table} description={p.tableHint}>
              <div className="hidden gap-4 text-xs font-medium text-ink-soft sm:grid sm:grid-cols-[1fr_1fr_1fr]">
                <span />
                <span>{p.buy}</span>
                <span>{p.sell}</span>
              </div>
              <div className="divide-y divide-line">
                {METAL_TYPES.map((metal) => {
                  const row = prices.rows[metal];
                  return (
                    <div
                      key={metal}
                      role="group"
                      aria-label={metalLabel(metal, locale)}
                      className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr_1fr] sm:items-start sm:gap-4"
                    >
                      <span className="font-medium sm:pt-2.5">{metalLabel(metal, locale)}</span>
                      {(["buy", "sell"] as const).map((side) => {
                        const name = `${metal}_${side}`;
                        return (
                          <div key={side}>
                            <label htmlFor={`f-${name}`} className="mb-1 block text-xs text-ink-soft sm:sr-only">
                              {p[side]}
                            </label>
                            <input
                              id={`f-${name}`}
                              name={name}
                              className="input"
                              inputMode="decimal"
                              autoComplete="off"
                              placeholder="—"
                              defaultValue={row?.[side] ?? ""}
                              aria-invalid={err[name] ? true : undefined}
                              aria-describedby={err[name] ? `f-${name}-err` : undefined}
                            />
                            <FieldError id={`f-${name}-err`} message={err[name]} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </Section>

            <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:static lg:rounded-xl lg:border lg:bg-white lg:px-5">
              <SubmitButton>{p.save}</SubmitButton>
            </div>
          </>
        );
      }}
    </ActionForm>
  );
}
