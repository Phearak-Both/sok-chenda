"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/server";
import {
  clearFailures,
  clientIp,
  createSession,
  destroySession,
  isThrottled,
  recordFailure,
  requireOwner,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { str, type FormState } from "@/lib/form";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/password";
import { createLinkCode, telegramConfigured, telegramLinkUrl, unlinkTelegram } from "@/lib/telegram";
import { fmt } from "@/i18n/format";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const { t } = await getDictionary();
  const email = str(form, "email", 200).toLowerCase();
  const password = str(form, "password", 500);
  const keys = [`ip:${await clientIp()}`, `email:${email}`];

  if (isThrottled(keys)) return { message: t.admin.login.throttled, at: Date.now() };

  const owner = getDb().prepare("SELECT id, password_hash FROM owners WHERE email = ?").get(email) as
    | { id: number; password_hash: string }
    | undefined;
  const valid = await verifyPassword(password, owner?.password_hash ?? DUMMY_HASH);

  if (!owner || !valid) {
    recordFailure(keys);
    return { message: t.admin.login.invalid, at: Date.now() };
  }

  clearFailures(keys);
  await createSession(owner.id);
  const next = str(form, "next");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const { t } = await getDictionary();
  const current = str(form, "current", 500);
  const next = str(form, "next", 500);
  const confirm = str(form, "confirm", 500);
  const errors: Record<string, string> = {};

  if (next.length < MIN_PASSWORD_LENGTH) errors.next = fmt(t.admin.account.tooShort, { n: MIN_PASSWORD_LENGTH });
  if (next !== confirm) errors.confirm = t.admin.account.mismatch;

  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM owners WHERE id = ?").get(owner.id) as { password_hash: string };
  if (!(await verifyPassword(current, row.password_hash))) errors.current = t.admin.account.wrongCurrent;
  if (Object.keys(errors).length) return { errors, message: t.admin.common.fixErrors, at: Date.now() };

  db.prepare("UPDATE owners SET password_hash = ? WHERE id = ?").run(await hashPassword(next), owner.id);
  // Sign out everywhere, then start a fresh session on this device.
  db.prepare("DELETE FROM sessions WHERE owner_id = ?").run(owner.id);
  await createSession(owner.id);
  return { ok: true, message: t.admin.account.changed, at: Date.now() };
}

// ---------- Telegram bot ----------

/** Opens the bot with a one-time code that links this Telegram account to the signed-in owner. */
export async function connectTelegram() {
  const owner = await requireOwner();
  if (!telegramConfigured()) redirect("/admin/account");
  redirect(telegramLinkUrl(createLinkCode(owner.id)));
}

export async function disconnectTelegram() {
  const owner = await requireOwner();
  unlinkTelegram(owner.id);
  revalidatePath("/admin/account");
}
