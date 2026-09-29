import { NextRequest, NextResponse } from "next/server";
import { updateActivityRecord, deleteActivityRecord, addActivityRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { contentId, author, action, note, version } = await req.json();
    if (!contentId || !action) {
      return NextResponse.json({ error: "contentId e action são obrigatórios." }, { status: 400 });
    }
    const id = await addActivityRecord(contentId, author || "Equipe Nurea", action, note, version || 1);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Erro ao criar atividade:", err);
    return NextResponse.json({ error: err?.message || "Erro ao criar atividade." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { activityId, author, action, note } = await req.json();
    if (!activityId) {
      return NextResponse.json({ error: "activityId é obrigatório." }, { status: 400 });
    }
    const success = await updateActivityRecord(activityId, { author, action, note });
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error("Erro ao atualizar atividade:", err);
    return NextResponse.json({ error: err?.message || "Erro ao atualizar atividade." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let id = req.nextUrl.searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id || body.activityId;
    }
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
    }
    const success = await deleteActivityRecord(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error("Erro ao excluir atividade:", err);
    return NextResponse.json({ error: err?.message || "Erro ao excluir atividade." }, { status: 500 });
  }
}
