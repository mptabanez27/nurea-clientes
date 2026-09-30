"use client";

import { useState, FormEvent } from "react";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user.trim() || !password) {
      setError("Preencha usuário e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Usuário ou senha incorretos.");
        setLoading(false);
        return;
      }

      // Sucesso: recarregar a página para entrar no painel
      window.location.reload();
    } catch (err) {
      setError("Erro de conexão ao autenticar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div
      className="admin-login"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b1e18",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#112620",
          border: "1px solid rgba(199, 165, 107, 0.25)",
          borderRadius: "16px",
          padding: "44px 36px",
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.5)",
          color: "#f7f4ee",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src="/brand/logopng1.svg"
            alt="Nurea"
            width="140"
            height="42"
            style={{ margin: "0 auto 20px", display: "block" }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: "800",
              letterSpacing: "0.18em",
              color: "#c7a56b",
              textTransform: "uppercase",
            }}
          >
            Painel da Equipe
          </span>
          <h1
            style={{
              fontSize: "24px",
              fontFamily: "var(--font-playfair), serif",
              fontWeight: "400",
              margin: "8px 0 6px",
              color: "#f7f4ee",
              letterSpacing: "-0.025em",
              lineHeight: 1.12,
            }}
          >
            Acesso Administrativo
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "#9cb0a4",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Digite suas credenciais para gerenciar clientes, ciclos e aprovações.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(199, 130, 106, 0.15)",
              border: "1px solid rgba(199, 130, 106, 0.4)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#e89980",
              fontSize: "12px",
              marginBottom: "20px",
              textAlign: "center",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label
              htmlFor="admin-user"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                color: "#c2d0c7",
                marginBottom: "6px",
                letterSpacing: "0.02em",
              }}
            >
              Usuário ou E-mail
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7d72",
                  display: "flex",
                }}
              >
                <User size={16} />
              </span>
              <input
                id="admin-user"
                type="text"
                autoComplete="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin@agencianurea.com.br"
                required
                style={{
                  width: "100%",
                  backgroundColor: "#071712",
                  border: "1px solid rgba(231, 222, 210, 0.18)",
                  borderRadius: "8px",
                  padding: "12px 14px 12px 40px",
                  color: "#fff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                color: "#c2d0c7",
                marginBottom: "6px",
                letterSpacing: "0.02em",
              }}
            >
              Senha de Acesso
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7d72",
                  display: "flex",
                }}
              >
                <Lock size={16} />
              </span>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  backgroundColor: "#071712",
                  border: "1px solid rgba(231, 222, 210, 0.18)",
                  borderRadius: "8px",
                  padding: "12px 14px 12px 40px",
                  color: "#fff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: "#c7a56b",
              color: "#0b1e18",
              border: 0,
              borderRadius: "8px",
              minHeight: "46px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: loading ? "wait" : "pointer",
              transition: "transform 0.18s, background-color 0.18s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span>{loading ? "Entrando…" : "Entrar no painel"}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "10px",
            color: "#6b7d72",
            textAlign: "center",
          }}
        >
          <ShieldCheck size={14} color="#c7a56b" />
          <span>Acesso restrito e criptografado da Agência Nurea</span>
        </div>
      </div>
    </div>
  );
}
