import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "./auth";
import { getClientByToken } from "./db";
import { getSupabaseAdmin } from "./supabase";

export type ApiIdentity = { role: "equipe" | "cliente"; clientId?: string };

export function requireAdmin(req: NextRequest): NextResponse | null {
  return verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value)
    ? null
    : NextResponse.json({ error: "Entre como Equipe Nurea para continuar." }, { status: 401 });
}

export async function authorizeClient(
  req: NextRequest,
  clientId: string | null | undefined,
  teamOnly = false
): Promise<ApiIdentity | NextResponse> {
  if (!clientId) return NextResponse.json({ error: "Cliente não informado." }, { status: 400 });
  if (!requireAdmin(req)) return { role: "equipe" };
  if (teamOnly) return NextResponse.json({ error: "Apenas a equipe pode realizar esta ação." }, { status: 403 });
  const token = req.headers.get("x-nurea-client-token");
  if (!token) return NextResponse.json({ error: "Link de acesso necessário." }, { status: 401 });
  const client = await getClientByToken(token);
  if (!client || client.id !== clientId) {
    return NextResponse.json({ error: "Acesso a este cliente negado." }, { status: 403 });
  }
  return { role: "cliente", clientId };
}

export async function getContentOwner(contentId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("contents").select("client_id").eq("id", contentId).maybeSingle();
  if (error) throw error;
  return data?.client_id ?? null;
}
