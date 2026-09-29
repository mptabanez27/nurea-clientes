import { NextRequest, NextResponse } from "next/server";
import { updatePlanStatusRecord } from "@/lib/db";
import { authorizeClient } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { clientId, monthKey, status, action, author, note, fileUrl, fileName, exampleRemoved } = await req.json();

    if (!clientId || !monthKey || !status) {
      return NextResponse.json(
        { error: "clientId, monthKey e status são obrigatórios." },
        { status: 400 }
      );
    }

    const identity = await authorizeClient(req, clientId);
    if (identity instanceof NextResponse) return identity;
    if (identity.role === "cliente") {
      if (!(["aprovado", "ajuste"] as string[]).includes(status) || fileUrl !== undefined || fileName !== undefined || exampleRemoved !== undefined || (status === "ajuste" && !String(note || "").trim())) {
        return NextResponse.json({ error: "Ação de planejamento não permitida." }, { status: 403 });
      }
      const { data: cycle } = await getSupabaseAdmin().from("month_cycles")
        .select("plan_status").eq("client_id", clientId).eq("month_key", monthKey).maybeSingle();
      if (cycle?.plan_status !== "aguardando") {
        return NextResponse.json({ error: "O planejamento não está aguardando aprovação." }, { status: 409 });
      }
    } else if (status === "aguardando") {
      const { data: cycle } = await getSupabaseAdmin().from("month_cycles")
        .select("plan_file_url").eq("client_id", clientId).eq("month_key", monthKey).maybeSingle();
      if (!cycle?.plan_file_url) {
        return NextResponse.json({ error: "Adicione o arquivo do cliente antes de enviar para aprovação." }, { status: 409 });
      }
    }

    await updatePlanStatusRecord(
      clientId,
      monthKey,
      status,
      identity.role === "cliente" ? (status === "aprovado" ? "Planejamento aprovado" : "Ajuste solicitado no planejamento") : (action || "Atualizou planejamento"),
      identity.role === "cliente" ? "Cliente" : (author || "Equipe Nurea"),
      note,
      fileUrl,
      fileName,
      exampleRemoved
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
