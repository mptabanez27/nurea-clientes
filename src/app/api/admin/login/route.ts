import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, getExpectedSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, password } = await req.json();

    if (!user || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const isValid = checkAdminCredentials(user, password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ success: true });
    
    // Cookie de sessão por 30 dias
    res.cookies.set("nurea_admin_session", getExpectedSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno no servidor ao autenticar." },
      { status: 500 }
    );
  }
}
