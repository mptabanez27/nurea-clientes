import { NextRequest, NextResponse } from "next/server";
import { updatePlanStatusRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { clientId, monthKey, status, action, author, note, fileUrl, fileName } = await req.json();

    if (!clientId || !monthKey || !status) {
      return NextResponse.json(
        { error: "clientId, monthKey e status são obrigatórios." },
        { status: 400 }
      );
    }

    await updatePlanStatusRecord(
      clientId,
      monthKey,
      status,
      action || "Atualizou planejamento",
      author || "Equipe Nurea",
      note,
      fileUrl,
      fileName
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao atualizar planejamento:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao atualizar planejamento." },
      { status: 500 }
    );
  }
}
