import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkAdminCredentials, createAdminSession } from "@/lib/auth";

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
    
    res.cookies.set(ADMIN_COOKIE, createAdminSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno no servidor ao autenticar." },
      { status: 500 }
    );
  }
}
