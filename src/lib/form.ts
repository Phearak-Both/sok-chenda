/** Result returned by dashboard server actions to their forms. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Changes on every submission so the form can react to repeated results. */
  at?: number;
};

export function str(form: FormData, key: string, max = 5000) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function int(form: FormData, key: string, fallback = 0) {
  const n = Number.parseInt(str(form, key), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(form: FormData, key: string) {
  return form.get(key) === "on" || form.get(key) === "1" || form.get(key) === "true";
}

export function localized(form: FormData, key: string, max = 5000) {
  return { en: str(form, `${key}_en`, max), km: str(form, `${key}_km`, max) };
}

export function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
