import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/plus-jakarta-sans/wght-italic.css";
import localFont from "next/font/local";
import "./globals.css";
import "./portal-refresh.css";
import "./mobile-emphasis.css";
import "./premium-theme.css";

const playfair = localFont({
  src: "../../public/fonts/Playfair-72pt-Regular.ttf",
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nurea | Conteúdos",
  description: "Espaço de planejamento e aprovação de conteúdos da Nurea.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={playfair.variable}>{children}</body>
    </html>
  );
}