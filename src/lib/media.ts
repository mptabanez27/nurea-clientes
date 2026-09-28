import { Attachment, ContentFormat } from "./demo";

export function mediaAccept(format: ContentFormat) {
  return format === "reels" ? "video/*" : format === "story" ? "image/*,video/*" : "image/*";
}

export function mediaIsCompatible(media: Attachment[], format: ContentFormat) {
  if (!media.length) return true;
  if (format === "carrossel") return media.length <= 10 && media.every((item) => item.type.startsWith("image/"));
  if (media.length !== 1) return false;
  return format === "reels" ? media[0].type.startsWith("video/") :
    format === "story" ? media[0].type.startsWith("image/") || media[0].type.startsWith("video/") : media[0].type.startsWith("image/");
}

export function validateMediaFiles(files: File[], format: ContentFormat): string | null {
  if (!files.length) return null;
  if (format !== "carrossel" && files.length > 1) return "Escolha somente um arquivo para este formato.";
  if (format === "carrossel" && files.length > 10) return "O carrossel aceita até 10 imagens nesta demonstração.";
  for (const file of files) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return "Escolha arquivos de imagem ou vídeo.";
    if (format === "reels" && !file.type.startsWith("video/")) return "Reels precisa de um arquivo de vídeo.";
    if ((format === "arte" || format === "carrossel") && !file.type.startsWith("image/")) return "Este formato precisa de imagem.";
    if (file.size > (file.type.startsWith("video/") ? 100 : 20) * 1024 * 1024) return "Limite local: 20 MB por imagem ou 100 MB por vídeo.";
  }
  return null;
}
