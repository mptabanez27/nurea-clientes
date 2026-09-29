import { NextRequest, NextResponse } from "next/server";
import { createMonthCycleRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, monthKey } = body;

    if (!clientId || !monthKey) {
      return NextResponse.json(
        { error: "clientId e monthKey são obrigatórios." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
      return NextResponse.json(
        { error: "Formato de mês inválido (esperado AAAA-MM)." },
        { status: 400 }
      );
    }

    const cycle = await createMonthCycleRecord(clientId, monthKey);
    return NextResponse.json({ success: true, cycle });
  } catch (err: any) {
    console.error("Erro ao criar ciclo de mês via API:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao criar ciclo de mês." },
      { status: 500 }
    );
  }
}
