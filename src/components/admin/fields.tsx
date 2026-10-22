"use client";

import { createContext, Fragment, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form";
import type { LocalizedText } from "@/lib/types";
import { CheckIcon } from "../icons";

const PendingContext = createContext<boolean | null>(null);

function usePending() {
  const fromForm = useFormStatus().pending;
  const fromContext = useContext(PendingContext);
  return fromContext ?? fromForm;
}

/**
 * A form bound to a server action that keeps what the owner typed when the action
 * returns validation errors (a plain <form action> would reset its fields).
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  children: (state: FormState) => React.ReactNode;
  className?: string;
  /** Clear the fields after a successful save (for "create another" forms). */
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (resetOnSuccess && state.ok) setResetKey((k) => k + 1);
  }, [resetOnSuccess, state.ok, state.at]);
  return (
    <PendingContext.Provider value={pending}>
      <form
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const data = new FormData(e.currentTarget, submitter);
          startTransition(() => formAction(data));
        }}
      >
        <Fragment key={resetKey}>{children(state)}</Fragment>
      </form>
    </PendingContext.Provider>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

type TextProps = {
  name: string;
  label: string;
  defaultValue?: string | number;
  hint?: string;
  error?: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  className?: string;
  maxLength?: number;
};

export function TextField({ name, label, hint, error, optional, className, ...rest }: TextProps) {
  const { t } = useI18n();
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-faint">({t.admin.common.optional})</span>}
      </label>
      <input
        id={id}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

/** English and Khmer inputs for one piece of content, side by side on wide screens. */
export function BilingualField({
  name,
  label,
  defaultValue,
  error,
  multiline,
  rows = 5,
  hint,
  maxLength,
}: {
  name: string;
  label: string;
  defaultValue?: LocalizedText;
  error?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  maxLength?: number;
}) {
  const { t } = useI18n();
  const [km, setKm] = useState(defaultValue?.km ?? "");
  const [en, setEn] = useState(defaultValue?.en ?? "");
  const langs = [
    { code: "en" as const, label: t.admin.common.english, value: en, set: setEn },
    { code: "km" as const, label: t.admin.common.khmer, value: km, set: setKm },
  ];
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {langs.map((l) => {
          const id = `f-${name}_${l.code}`;
          const props = {
            id,
            name: `${name}_${l.code}`,
            value: l.value,
            lang: l.code,
            maxLength,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => l.set(e.target.value),
            className: "input",
            "aria-invalid": error ? true : undefined,
          };
          return (
            <div key={l.code}>
              <label htmlFor={id} className="mb-1 block text-[0.6875rem] font-medium uppercase tracking-wider text-ink-faint">
                {l.label}
              </label>
              {multiline ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
            </div>
          );
        })}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      {!error && en.trim() && !km.trim() && <p className="field-hint text-gold">{t.admin.common.noKhmer}</p>}
      <FieldError message={error} />
    </fieldset>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  options: { value: string | number; label: string }[];
  className?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="input cursor-pointer">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
  value,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  value?: string;
  hint?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
      <input
        type="checkbox"
        name={name}
        value={value ?? "on"}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-ink)]"
      />
      <span className="text-sm">
        {label}
        {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  className = "abtn abtn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const pending = usePending();
  const { t } = useI18n();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={className}>
      {pending ? t.admin.common.saving : children}
    </button>
  );
}

/** Success / error banner for a form result. Success messages fade after a few seconds. */
export function FormBanner({ state }: { state: FormState }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state.message) return;
    setVisible(true);
    if (!state.ok) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (state.ok) {
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [state.at, state.message, state.ok]);
  if (!state.message || !visible) return <div ref={ref} />;
  return (
    <div
      ref={ref}
      role={state.ok ? "status" : "alert"}
      className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
        state.ok ? "bg-[#edf3ec] text-success" : "bg-[#fbeeeb] text-danger"
      }`}
    >
      {state.ok && <CheckIcon size={16} />}
      {state.message}
    </div>
  );
}

/** A submit button that asks for confirmation first. Use inside a <form action={...}>. */
export function ConfirmButton({
  message,
  children,
  className = "abtn abtn-danger",
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? t.admin.common.deleting : children}
    </button>
  );
}

/** A small submit button for one-click actions (publish, feature, …) that shows progress. */
export function ActionButton({
  children,
  className = "abtn abtn-sm",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} ${pending ? "opacity-50" : ""}`} title={title} aria-label={title}>
      {children}
    </button>
  );
}

export function Section({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
