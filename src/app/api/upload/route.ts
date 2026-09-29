import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const claimedSize = Number(req.headers.get("content-length") || 0);
    if (claimedSize > 105 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo acima do limite permitido." }, { status: 413 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const path = (formData.get("path") as string) || `uploads/${Date.now()}-${file?.name || "file"}`;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const folder = path.split("/")[0];
    if (!(["plans", "posts", "logos", "attachments", "covers"] as string[]).includes(folder)) {
      return NextResponse.json({ error: "Caminho de arquivo inválido." }, { status: 400 });
    }
    const allowed = file.type === "application/pdf" || file.type.startsWith("image/") || file.type.startsWith("video/");
    const maxBytes = (folder === "logos" ? 5 : file.type.startsWith("video/") ? 100 : 20) * 1024 * 1024;
    if (!allowed || file.size > maxBytes || file.size === 0) {
      return NextResponse.json({ error: "Arquivo inválido ou acima do limite do formato." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const cleanPath = `${folder}/${crypto.randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await admin.storage
      .from("midias")
      .upload(cleanPath, buffer, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
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
