import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import "./portal-refresh.css";
import "./mobile-emphasis.css";
import "./premium-theme.css";

export const metadata: Metadata = {
  title: "Nurea | Conteúdos",
  description: "Espaço de planejamento e aprovação de conteúdos da Nurea.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
