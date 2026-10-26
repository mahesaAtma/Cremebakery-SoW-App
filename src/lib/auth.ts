import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "sow_session";
const SESSION_DAYS = 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET harus diisi, minimal 32 karakter. Lihat README.");
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/** Constant-time comparison of two strings of any length. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.OWNER_USERNAME;
  const p = process.env.OWNER_PASSWORD;
  if (!u || !p) return false;
  // evaluate both so timing doesn't reveal which one was wrong
  const okUser = safeEqual(username, u);
  const okPass = safeEqual(password, p);
  return okUser && okPass;
}

export async function createSession() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `owner.${expires}`;
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isOwner(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  const payload = `${role}.${exp}`;
  if (role !== "owner" || !safeEqual(sig, sign(payload))) return false;
  return Number(exp) > Date.now();
}

/** Call at the top of every owner-only server action. */
export async function requireOwner() {
  if (!(await isOwner())) {
    throw new Error("Tidak diizinkan. Silakan masuk sebagai pemilik.");
  }
}
