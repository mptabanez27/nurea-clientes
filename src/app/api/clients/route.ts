import { NextRequest, NextResponse } from "next/server";
import { createClient, getAllClients } from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const clients = await getAllClients();
    return NextResponse.json(clients);
  } catch (err: any) {
    console.error("Erro ao listar clientes:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao buscar clientes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório." },
        { status: 400 }
      );
    }

    const created = await createClient(name.trim());
    return NextResponse.json(created);
  } catch (err: any) {
    console.error("Erro ao criar cliente:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao criar cliente." },
      { status: 500 }
    );
  }
}
