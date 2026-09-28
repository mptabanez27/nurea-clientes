"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import Artwork from "./Artwork";
import { Attachment, Content } from "@/lib/demo";
import { getLocalFile } from "@/lib/localFiles";
import { getVideoPoster } from "@/lib/videoPoster";

type Props = {
  content: Content;
  brand: string;
  mode?: "grid" | "list" | "detail" | "story";
  slideIndex?: number;
  attachment?: Attachment | null;
};

const emptyMedia: Attachment[] = [];

export function InteractiveVideoPlayer({
  src,
  poster,
  isDemo = false,
  title,
}: {
  src: string;
  poster?: string;
  isDemo?: boolean;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const handlePlayToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((err) => {
        console.warn("Reprodução prevenida pelo navegador:", err);
      });
    } else {
      video.pause();
    }
  };

  return (
    <div className="interactive-video-player" onClick={handlePlayToggle}>
      <video
        ref={videoRef}
        key={src}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="interactive-video-element"
        aria-label={title || "Vídeo da publicação"}
      />
      {!isPlaying && (
        <div className="video-play-overlay">
          <button
            type="button"
            className="video-big-play-btn"
            onClick={handlePlayToggle}
            aria-label="Reproduzir vídeo"
          >
            <Play size={36} fill="#ffffff" color="#ffffff" style={{ marginLeft: "4px" }} />
          </button>
          {isDemo && (
            <span className="video-demo-tag">
              Vídeo demonstrativo (Reels) · Clique no play para assistir
            </span>
          )}
        </div>
      )}
    </div>
  );
}

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
    Promise.all(
      items.map(async (item) => {
        if (item.url) {
          if (item.coverUrl) {
            setPosters((previous) => ({ ...previous, [item.id]: item.coverUrl! }));
          }
          return [item.id, item.url] as const;
        }
        const blob = await getLocalFile(item.id);
        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        created.push(url);
        if (item.type.startsWith("video/")) {
          const posterPromise = item.coverFileId
            ? getLocalFile(item.coverFileId).then((custom) => custom ?? getVideoPoster(item.id, blob))
            : getVideoPoster(item.id, blob);
          posterPromise
            .then((poster) => {
              if (!poster || !active) return;
              const posterUrl = URL.createObjectURL(poster);
              created.push(posterUrl);
              setPosters((previous) => ({ ...previous, [item.id]: posterUrl }));
            })
            .catch(() => {});
        }
        return [item.id, url] as const;
      })
    )
      .then((entries) => {
        if (active) setUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
        else created.forEach(URL.revokeObjectURL);
      })
      .catch(() => {
        if (active) setUrls({});
      });
    return () => {
      active = false;
      created.forEach(URL.revokeObjectURL);
    };
  }, [items]);

  const item = items[Math.min(slideIndex, Math.max(0, items.length - 1))];
  const url = item ? urls[item.id] || item.url : undefined;
  const isVideo = item ? item.type.startsWith("video/") : content.format === "reels";

  // Detail mode with video (either uploaded or fallback demo)
  if (mode === "detail" && isVideo) {
    if (url) {
      return (
        <div className="media-preview media-preview-detail">
          <InteractiveVideoPlayer
            src={url}
            poster={posters[item?.id ?? ""] || item?.coverUrl}
            title={item?.name || content.title}
          />
        </div>
      );
    }
    // Fallback sample video for Reels when no file is uploaded yet
    return (
      <div className="media-preview media-preview-detail">
        <InteractiveVideoPlayer
          src="/sample-reel.mp4"
          isDemo={true}
          title={content.title}
        />
      </div>
    );
  }

  // If item exists with a valid URL (image or non-detail video)
  if (item && url) {
    return (
      <div className={`media-preview media-preview-${mode}`}>
        {item.type.startsWith("video/") ? (
          <>
            {posters[item.id] ? (
              <img src={posters[item.id]} alt="" />
            ) : (
              <video key={url} src={url} muted playsInline preload="metadata" aria-hidden="true" />
            )}
            {mode !== "detail" && (
              <span className="media-video-mark" aria-hidden="true">
                <Play size={18} fill="currentColor" />
              </span>
            )}
          </>
        ) : (
          <img
            src={url}
            alt={content.format === "carrossel" ? `${content.title}, imagem ${slideIndex + 1}` : content.title}
          />
        )}
      </div>
    );
  }

  // Fallback to artwork
  return (
    <Artwork
      content={content}
      brand={brand}
      title={content.format === "carrossel" && content.slides ? content.slides[slideIndex] : undefined}
      large={mode === "detail"}
    />
  );
}
