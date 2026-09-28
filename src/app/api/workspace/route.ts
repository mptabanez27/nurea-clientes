import { NextRequest, NextResponse } from "next/server";
import { loadWorkspaceData } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get("clientId");
    const monthKey = req.nextUrl.searchParams.get("monthKey") || "2026-09";

    if (!clientId) {
      return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
    }

    const data = await loadWorkspaceData(clientId, monthKey);

    if (!data) {
      return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
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
