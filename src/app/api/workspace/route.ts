import { NextRequest, NextResponse } from "next/server";
import { loadWorkspaceData } from "@/lib/db";
import { authorizeClient } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get("clientId");
    const monthKey = req.nextUrl.searchParams.get("monthKey") || "2026-09";

    if (!clientId) {
      return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
      return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
    }

    const identity = await authorizeClient(req, clientId);
    if (identity instanceof NextResponse) return identity;

    const data = await loadWorkspaceData(clientId, monthKey);

    if (!data) {
      return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
    }

    if (identity.role === "cliente") {
      data.contents = data.contents.filter((content) => content.status !== "producao");
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Erro ao carregar workspace via API:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao carregar workspace." },
      { status: 500 }
    );
  }
}
