import { NextRequest, NextResponse } from "next/server";
import { updateClientLogoSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { clientId, ...settings } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
    }

    await updateClientLogoSettings(clientId, settings);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao atualizar logo do cliente:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao salvar configurações da logo." },
      { status: 500 }
    );
  }
}
