import { NextRequest, NextResponse } from "next/server";
import { deleteContentRecord, saveContentRecord } from "@/lib/db";
import { getContentOwner, requireAdmin } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { clientId, monthKey, content } = await req.json();

    if (!clientId || !monthKey || !content) {
      return NextResponse.json(
        { error: "clientId, monthKey e content são obrigatórios." },
        { status: 400 }
      );
    }

    const existingOwner = content.id ? await getContentOwner(content.id) : null;
    if (existingOwner && existingOwner !== clientId) {
      return NextResponse.json({ error: "Conteúdo pertence a outro cliente." }, { status: 403 });
    }
    if (!existingOwner) {
      const { data: cycle, error: cycleError } = await getSupabaseAdmin().from("month_cycles")
        .select("plan_status").eq("client_id", clientId).eq("month_key", monthKey).maybeSingle();
      if (cycleError) throw cycleError;
      if (cycle?.plan_status !== "aprovado") {
        return NextResponse.json({ error: "Aprove o planejamento antes de criar conteúdos neste mês." }, { status: 409 });
      }
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
  const denied = requireAdmin(req);
  if (denied) return denied;
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
