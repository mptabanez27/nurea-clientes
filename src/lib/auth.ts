import { cookies } from "next/headers";

const ADMIN_USER = process.env.ADMIN_USER || "marcos";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "nurea@2026";
const SESSION_SECRET = process.env.SESSION_SECRET || "nurea-secret-session-token-2026";
const COOKIE_NAME = "nurea_admin_session";

export function checkAdminCredentials(user: string, pass: string): boolean {
  const normalizedUser = user.trim().toLowerCase();
  const validUsers = [
    ADMIN_USER.toLowerCase(),
    "admin",
    "marcos",
    "mptabanez27@gmail.com",
    "admin@agencianurea.com.br",
  ];

  const userMatches = validUsers.includes(normalizedUser);
  const passMatches = pass === ADMIN_PASSWORD;

  return userMatches && passMatches;
}

export function getExpectedSessionToken(): string {
  return SESSION_SECRET;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  return session === SESSION_SECRET;
}
