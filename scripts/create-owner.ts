/**
 * Creates the owner login, or resets the password of an existing one.
 *
 *   npm run owner:create
 *
 * Non-interactive (e.g. on a server): OWNER_EMAIL=... OWNER_PASSWORD=... npm run owner:create
 */
import readline from "node:readline";
import { getDb } from "../src/lib/db";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/password";

function ask(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Echo nothing while the password is typed.
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.includes(question)) process.stdout.write(question);
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    }),
  );
}

async function main() {
  const email = (process.env.OWNER_EMAIL || (await ask("Owner email: "))).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That does not look like an email address.");

  let password = process.env.OWNER_PASSWORD || "";
  if (!password) {
    password = await ask(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `, true);
    const again = await ask("Repeat password: ", true);
    if (password !== again) throw new Error("Passwords do not match.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const db = getDb();
  const hash = await hashPassword(password);
  const existing = db.prepare("SELECT id FROM owners WHERE email = ?").get(email) as { id: number } | undefined;
  if (existing) {
    db.prepare("UPDATE owners SET password_hash = ? WHERE id = ?").run(hash, existing.id);
    db.prepare("DELETE FROM sessions WHERE owner_id = ?").run(existing.id);
    console.log(`Password updated for ${email}. Existing sessions were signed out.`);
  } else {
    db.prepare("INSERT INTO owners (email, password_hash) VALUES (?, ?)").run(email, hash);
    console.log(`Owner account created for ${email}. Sign in at /admin.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
