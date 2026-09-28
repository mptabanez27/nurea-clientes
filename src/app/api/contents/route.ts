import { NextRequest, NextResponse } from "next/server";
import { deleteContentRecord, saveContentRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { clientId, monthKey, content } = await req.json();

    if (!clientId || !monthKey || !content) {
      return NextResponse.json(
        { error: "clientId, monthKey e content são obrigatórios." },
        { status: 400 }
      );
    }

    const savedId = await saveContentRecord(clientId, monthKey, content);
    return NextResponse.json({ success: true, id: savedId });
  } catch (err: any) {
    console.error("Erro ao salvar conteúdo:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao salvar conteúdo." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
    }

    await deleteContentRecord(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao excluir conteúdo:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao excluir conteúdo." },
      { status: 500 }
    );
  }
}
