import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "nurea_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkAdminCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword || !process.env.SESSION_SECRET) return false;
  return equal(user.trim().toLowerCase(), expectedUser.trim().toLowerCase()) && equal(pass, expectedPassword);
}

export function createAdminSession(): string {
  const key = process.env.SESSION_SECRET;
  if (!key) throw new Error("SESSION_SECRET não configurado.");
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", key).update(issuedAt).digest("hex");
  return `${issuedAt}.${signature}`;
}

export function verifyAdminSession(value?: string): boolean {
  const key = process.env.SESSION_SECRET;
  if (!key || !value) return false;
  const [issuedAt, signature, extra] = value.split(".");
  if (extra || !/^\d+$/.test(issuedAt || "") || !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (age < 0 || age > SESSION_SECONDS) return false;
  const expected = createHmac("sha256", key).update(issuedAt).digest("hex");
  return equal(signature, expected);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
}
