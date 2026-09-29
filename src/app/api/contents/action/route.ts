import { NextRequest, NextResponse } from "next/server";
import { addActivityRecord } from "@/lib/db";
import { authorizeClient, getContentOwner } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { contentId, clientId, monthKey, status, action, note, author, version } = await req.json();

    if (!contentId || !clientId || !status) {
      return NextResponse.json(
        { error: "contentId e status são obrigatórios." },
        { status: 400 }
      );
    }

    const owner = await getContentOwner(contentId);
    if (!owner || owner !== clientId) return NextResponse.json({ error: "Conteúdo não encontrado para este cliente." }, { status: 404 });
    const identity = await authorizeClient(req, clientId);
    if (identity instanceof NextResponse) return identity;
    const { data: existing, error: lookupError } = await getSupabaseAdmin().from("contents")
      .select("status, version, month_key").eq("id", contentId).single();
    if (lookupError || existing?.month_key !== monthKey) return NextResponse.json({ error: "Conteúdo não encontrado neste mês." }, { status: 404 });
    if (identity.role === "cliente") {
      const comment = existing.status !== "producao" && action === "Comentário" && status === existing.status && String(note || "").trim();
      const decision = existing.status === "aguardando" && (status === "aprovado" || (status === "ajuste" && String(note || "").trim()));
      if (!comment && !decision) return NextResponse.json({ error: "Esta ação não está disponível para o cliente." }, { status: 403 });
    }

    if (status !== existing.status) {
      const { error: statusError } = await getSupabaseAdmin().from("contents")
        .update({ status }).eq("id", contentId).eq("client_id", clientId);
      if (statusError) throw statusError;
    }
    let activityId: string | undefined;
    try {
      activityId = await addActivityRecord(
        contentId,
        identity.role === "cliente" ? "Cliente" : (author || "Equipe Nurea"),
        identity.role === "cliente" ? (status === "aprovado" ? "Conteúdo aprovado" : status === "ajuste" ? "Ajuste solicitado" : "Comentário") : (action || "Atualizou status"),
        note,
        existing.version || version || 1
      );
    } catch (activityError) {
      if (status !== existing.status) {
        await getSupabaseAdmin().from("contents").update({ status: existing.status }).eq("id", contentId).eq("client_id", clientId);
      }
      throw activityError;
    }

    return NextResponse.json({ success: true, activityId });
  } catch (err: any) {
    console.error("Erro ao registrar ação no conteúdo:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao registrar ação." },
      { status: 500 }
    );
  }
}
