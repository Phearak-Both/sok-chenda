import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";

export const SESSION_COOKIE = "sc_session";
const SESSION_DAYS = 30;

export type Owner = { id: number; email: string; name: string };

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function createSession(ownerId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("INSERT INTO sessions (token_hash, owner_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    ownerId,
    expiresAt,
  );
  // Secure cookies are dropped over plain http, so only require them when the site is served over https.
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim();
  const secure = proto === "https" || (process.env.SITE_URL ?? "").startsWith("https://");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in owner, or null. Cached for the duration of one request. */
export const getOwner = cache(async (): Promise<Owner | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT o.id, o.email, o.name FROM sessions s JOIN owners o ON o.id = s.owner_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as Owner | undefined;
  return row ?? null;
});

/** Use at the top of every admin page and server action. */
export async function requireOwner(): Promise<Owner> {
  const owner = await getOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}

// ---------- Login throttling ----------

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export function isThrottled(keys: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM login_attempts WHERE at < ?").run(Date.now() - WINDOW_MS);
  const stmt = db.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE key = ?");
  return keys.some((k) => (stmt.get(k) as { n: number }).n >= MAX_FAILURES);
}

export function recordFailure(keys: string[]) {
  const stmt = getDb().prepare("INSERT INTO login_attempts (key, at) VALUES (?, ?)");
  for (const k of keys) stmt.run(k, Date.now());
}

export function clearFailures(keys: string[]) {
  const stmt = getDb().prepare("DELETE FROM login_attempts WHERE key = ?");
  for (const k of keys) stmt.run(k);
}
