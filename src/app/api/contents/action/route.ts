import { NextRequest, NextResponse } from "next/server";
import { addActivityRecord, saveContentRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { contentId, clientId, monthKey, status, action, note, author, version } = await req.json();

    if (!contentId || !status) {
      return NextResponse.json(
        { error: "contentId e status são obrigatórios." },
        { status: 400 }
      );
    }

    if (clientId && monthKey) {
      await saveContentRecord(clientId, monthKey, { id: contentId, status } as any);
    }
    const activityId = await addActivityRecord(
      contentId,
      author || "Equipe Nurea",
      action || "Atualizou status",
      note,
      version || 1
    );

    return NextResponse.json({ success: true, activityId });
  } catch (err: any) {
    console.error("Erro ao registrar ação no conteúdo:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao registrar ação." },
      { status: 500 }
    );
  }
}
