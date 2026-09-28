import Portal from "@/components/Portal";
import { getClientByToken } from "@/lib/db";

export default async function ClientExclusivePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#0b1e18",
          color: "#f7f4ee",
          padding: "24px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "#132822",
            border: "1px solid rgba(199, 165, 107, 0.3)",
            borderRadius: "16px",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
          }}
        >
          <img
            src="/brand/logopng1.svg"
            alt="Nurea"
            width="150"
            height="44"
            style={{ margin: "0 auto 24px", display: "block" }}
          />
          <h1 style={{ fontSize: "21px", margin: "0 0 12px", color: "#f7f4ee", fontWeight: "600" }}>
            Link exclusivo não encontrado
          </h1>
          <p style={{ fontSize: "14px", color: "#a5b4ab", lineHeight: "1.6", margin: "0 0 28px" }}>
            Este link de acesso ao portal não é válido ou foi atualizado. Solicite à equipe Nurea um novo link de acesso direto.
          </p>
          <a
            href="https://agencianurea.com.br"
            style={{
              display: "inline-block",
              backgroundColor: "#c7a56b",
              color: "#0b1e18",
              fontWeight: "700",
              fontSize: "12px",
              letterSpacing: "0.04em",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Acessar Agência Nurea
          </a>
        </div>
      </div>
    );
  }

  return (
    <Portal
      initialClientId={client.id}
      initialRole="cliente"
      fixedRole={true}
      fixedClient={true}
      clientToken={token}
    />
  );
}
