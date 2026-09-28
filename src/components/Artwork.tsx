import { Play } from "lucide-react";
import { Content } from "@/lib/demo";

export default function Artwork({ content, brand, title, large = false }: { content: Content; brand: string; title?: string; large?: boolean }) {
  return (
    <div className={`artwork artwork-${content.cover} ${large ? "artwork-large" : ""}`}>
      <div className="artwork-orbit" aria-hidden="true" />
      <span className="artwork-brand">{brand}</span>
      <div className="artwork-title">{title ?? content.title}</div>
      <span className="artwork-foot">CONTEÚDO EM DESENVOLVIMENTO</span>
      {content.format === "reels" && <span className="artwork-play"><Play size={large ? 30 : 20} fill="currentColor" /></span>}
      {content.format === "carrossel" && <span className="artwork-pages" aria-label="Carrossel">▣</span>}
    </div>
  );
}
