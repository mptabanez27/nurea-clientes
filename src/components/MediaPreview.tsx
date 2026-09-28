"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import Artwork from "./Artwork";
import { Attachment, Content } from "@/lib/demo";
import { getLocalFile } from "@/lib/localFiles";
import { getVideoPoster } from "@/lib/videoPoster";

type Props = { content: Content; brand: string; mode?: "grid" | "list" | "detail" | "story"; slideIndex?: number; attachment?: Attachment | null };
const emptyMedia: Attachment[] = [];

export default function MediaPreview({ content, brand, mode = "grid", slideIndex = 0, attachment }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [posters, setPosters] = useState<Record<string, string>>({});
  const items = useMemo(() => {
    if (attachment) return [attachment];
    if (content.media?.length) return content.media;
    const visual = content.attachments?.find((item) => item.type.startsWith("image/") || item.type.startsWith("video/"));
    return visual ? [visual] : emptyMedia;
  }, [attachment, content.media, content.attachments]);

  useEffect(() => {
    let active = true;
    const created: string[] = [];
    setUrls({});
    setPosters({});
    Promise.all(items.map(async (item) => {
      const blob = await getLocalFile(item.id);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      created.push(url);
      if (item.type.startsWith("video/")) {
        const posterPromise = item.coverFileId
          ? getLocalFile(item.coverFileId).then((custom) => custom ?? getVideoPoster(item.id, blob))
          : getVideoPoster(item.id, blob);
        posterPromise.then((poster) => {
          if (!poster || !active) return;
          const posterUrl = URL.createObjectURL(poster);
          created.push(posterUrl);
          setPosters((previous) => ({ ...previous, [item.id]: posterUrl }));
        }).catch(() => {});
      }
      return [item.id, url] as const;
    })).then((entries) => {
      if (active) setUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
      else created.forEach(URL.revokeObjectURL);
    }).catch(() => { if (active) setUrls({}); });
    return () => { active = false; created.forEach(URL.revokeObjectURL); };
  }, [items]);

  const item = items[Math.min(slideIndex, items.length - 1)];
  const url = item ? urls[item.id] : undefined;
  if (item && url) {
    return <div className={`media-preview media-preview-${mode}`}>
      {item.type.startsWith("video/") ? <>{mode === "detail" ? <video key={`${url}:${item.coverFileId ?? "auto"}`} src={url} poster={posters[item.id]} controls playsInline preload="metadata" aria-label={`Vídeo: ${item.name}`} /> : posters[item.id] ? <img src={posters[item.id]} alt="" /> : <video key={url} src={url} muted playsInline preload="metadata" aria-hidden="true" />}{mode !== "detail" && <span className="media-video-mark" aria-hidden="true"><Play size={18} fill="currentColor" /></span>}</> : <img src={url} alt={content.format === "carrossel" ? `${content.title}, imagem ${slideIndex + 1}` : content.title} />}
    </div>;
  }
  return <Artwork content={content} brand={brand} title={content.format === "carrossel" && content.slides ? content.slides[slideIndex] : undefined} large={mode === "detail"} />;
}
