import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "items array é obrigatório." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Atualiza o post_number de cada post na ordem nova
    const updates = items.map(async (item: { id: string; postNumber: number }) => {
      if (item.id && typeof item.postNumber === "number") {
        return admin
          .from("contents")
          .update({ post_number: item.postNumber })
          .eq("id", item.id);
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao reordenar posts no Supabase:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao reordenar posts." },
      { status: 500 }
    );
  }
}
