import { NextRequest, NextResponse } from "next/server";
import { addActivityRecord } from "@/lib/db";
import { getContentOwner, requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { contentId, author, action, note, version } = await req.json();
    if (!contentId || !action) {
      return NextResponse.json({ error: "contentId e action são obrigatórios." }, { status: 400 });
    }
    if (!await getContentOwner(contentId)) return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
    const id = await addActivityRecord(contentId, author || "Equipe Nurea", action, note, version || 1);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Erro ao criar atividade:", err);
    return NextResponse.json({ error: err?.message || "Erro ao criar atividade." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json({ error: "Registros são imutáveis. Adicione uma correção." }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json({ error: "Registros são imutáveis. Adicione uma correção." }, { status: 405 });
}
