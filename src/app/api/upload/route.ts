import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const path = (formData.get("path") as string) || `uploads/${Date.now()}-${file?.name || "file"}`;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const cleanPath = path.replace(/^\/+/, "");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await admin.storage
      .from("midias")
      .upload(cleanPath, buffer, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Erro no upload do Supabase Storage:", error);
      return NextResponse.json(
        { error: `Erro no storage: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: publicData } = admin.storage
      .from("midias")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      path: data.path,
    });
  } catch (err: any) {
    console.error("Erro interno no upload:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno ao processar upload." },
      { status: 500 }
    );
  }
}
