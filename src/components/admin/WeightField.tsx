"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import {
  formatWeightKm,
  parseWeightInput,
  UNIT_EN,
  UNIT_KM,
  WEIGHT_UNITS,
  weightInputValue,
  weightSecondary,
  type WeightUnit,
} from "@/lib/weight";
import { FieldError } from "./fields";

/** Gold weight typed in ដំឡឹង / ជី / ហ៊ុន / grams. Switching unit converts the number, keeping the weight. */
export function WeightField({ initialGrams, error }: { initialGrams: number | null; error?: string }) {
  const { t, locale } = useI18n();
  const p = t.admin.products;
  const [unit, setUnit] = useState<WeightUnit>("chi");
  const [value, setValue] = useState(weightInputValue(initialGrams, "chi"));

  const grams = parseWeightInput(value, unit);

  const changeUnit = (next: WeightUnit) => {
    if (typeof grams === "number") setValue(weightInputValue(grams, next));
    setUnit(next);
  };

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label htmlFor="f-weight_value" className="field-label">
            {p.weight}
            <span className="ml-1.5 font-normal text-ink-faint">({t.admin.common.optional})</span>
          </label>
          <input
            id="f-weight_value"
            name="weight_value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="2"
            className="input"
            aria-invalid={error || grams === "invalid" ? true : undefined}
          />
        </div>
        <div>
          <label htmlFor="f-weight_unit" className="field-label">
            {p.weightUnit}
          </label>
          <select
            id="f-weight_unit"
            name="weight_unit"
            value={unit}
            onChange={(e) => changeUnit(e.target.value as WeightUnit)}
            className="input cursor-pointer"
          >
            {WEIGHT_UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_KM[u]} ({UNIT_EN[u]})
              </option>
            ))}
          </select>
        </div>
      </div>
      {typeof grams === "number" && (
        <p className="mt-3 rounded-md bg-cream/70 px-3 py-2 text-sm" aria-live="polite">
          <span className="text-ink-faint">{p.weightPreview}: </span>
          <span lang="km" className="font-medium">
            {formatWeightKm(grams)}
          </span>
          <span className="block text-xs text-ink-faint">{weightSecondary(grams, locale)}</span>
        </p>
      )}
      <FieldError message={error ?? (grams === "invalid" ? p.invalidWeight : undefined)} />
      <p className="field-hint">{p.weightHint}</p>
    </div>
  );
}
