"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Heart, MessageCircle, MoreHorizontal, Paperclip, Play, Plus, Send, X } from "lucide-react";
import MediaPreview from "./MediaPreview";
import { Attachment, Content, ContentFormat, ContentStatus, formatActivityDate, formatLabel, statusLabel, todayStamp } from "@/lib/demo";
import { deleteLocalFile, getLocalFile, saveLocalFile } from "@/lib/localFiles";
import { mediaAccept, mediaIsCompatible, validateMediaFiles } from "@/lib/media";

type Props = {
  content: Content;
  clientName: string;
  clientLogo?: string;
  clientSlug?: string;
  role: "cliente" | "equipe";
  position: number;
  total: number;
  onClose: () => void;
  onDelete: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onUpdate: (transform: (content: Content) => Content) => void;
  onAction: (status: ContentStatus, action: string, note?: string) => void;
};

function uid() { return crypto.randomUUID(); }
function fullDate(date: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
function getInstagramHandle(name: string): string {
  const clean = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 30);
  return clean || "usuario";
}
function revision(content: Content, note: string): Content {
  const version = content.version + 1;
  return {
    ...content,
    version,
    status: "producao",
    activity: [{ id: uid(), author: "Equipe Nurea", action: "Nova versão criada", note, at: todayStamp(), version }, ...content.activity],
  };
}

export default function ContentDetail({ content, clientName, clientLogo, clientSlug, role, position, total, onClose, onDelete, onNavigate, onUpdate, onAction }: Props) {
  const captionRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<HTMLDivElement>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [editCategory, setEditCategory] = useState(content.category);
  const [editPublishedUrl, setEditPublishedUrl] = useState(content.publishedUrl ?? "");
  const [editShared, setEditShared] = useState(!!content.sharedToStory);
  const [editExistingMedia, setEditExistingMedia] = useState(content.media ?? []);
  const interactionRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState("");
  const [adjustTarget, setAdjustTarget] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(content.title);
  const [editFormat, setEditFormat] = useState<ContentFormat>(content.format);
  const [editDate, setEditDate] = useState(content.date);
  const [editCaption, setEditCaption] = useState([content.caption, content.cta].filter(Boolean).join("\n\n"));
  const [editMediaFiles, setEditMediaFiles] = useState<File[]>([]);
  const [editMediaError, setEditMediaError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [coverSaving, setCoverSaving] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [coverDraft, setCoverDraft] = useState({ scale: 100, x: 0, y: 0 });
  const coverDragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    if (adjustOpen || commentOpen) {
      interactionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      interactionRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
    }
  }, [adjustOpen, commentOpen]);
  useEffect(() => { if (editOpen) { dialogRef.current?.querySelector(".content-edit")?.scrollIntoView({ behavior: "smooth", block: "start" }); dialogRef.current?.querySelector<HTMLInputElement>(".content-edit input")?.focus({ preventScroll: true }); } }, [editOpen]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length && !el.classList.contains("sr-only"));
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    Promise.all((content.attachments ?? []).map(async (item) => {
      if (item.url) {
        return [item.id, item.url] as const;
      }
      const blob = await getLocalFile(item.id);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      urls.push(url);
      return [item.id, url] as const;
    })).then((entries) => {
      if (active) setAttachmentUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
      else urls.forEach(URL.revokeObjectURL);
    }).catch(() => { if (active) setFileError("Não foi possível abrir os anexos locais."); });
    return () => { active = false; urls.forEach(URL.revokeObjectURL); };
  }, [content.attachments]);

  function startEdit() {
    setEditTitle(content.title);
    setEditCategory(content.category);
    setEditPublishedUrl(content.publishedUrl ?? "");
    setEditShared(!!content.sharedToStory);
    setEditExistingMedia(content.media ?? []);
    setEditFormat(content.format);
    setEditDate(content.date);
    setEditCaption([content.caption, content.cta].filter(Boolean).join("\n\n"));
    setEditMediaFiles([]);
    setEditMediaError("");
    setEditOpen(true);
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editTitle.trim() || !editDate || editSaving) return;
    const validation = validateMediaFiles(editMediaFiles, editFormat);
    if (validation) { setEditMediaError(validation); return; }
    if (!editMediaFiles.length && !mediaIsCompatible(editExistingMedia, editFormat)) {
      setEditMediaError("O arquivo atual não combina com o novo formato. Selecione uma nova mídia.");
      return;
    }
    const combined = [content.caption, content.cta].filter(Boolean).join("\n\n");
    const materialChanged = content.title !== editTitle.trim() || content.date !== editDate || content.format !== editFormat || combined !== editCaption.trim() || editMediaFiles.length > 0 || JSON.stringify(editExistingMedia) !== JSON.stringify(content.media ?? []) || editCategory.trim() !== content.category;
    const changed = materialChanged || editPublishedUrl.trim() !== (content.publishedUrl ?? "") || editShared !== !!content.sharedToStory;
    if (!changed) { setEditOpen(false); return; }
    setEditSaving(true);
    setEditMediaError("");
    const savedItems: Attachment[] = [];
    try {
      for (const file of editMediaFiles) {
        let fileUrl: string | undefined;
        try {
          const { uploadFileToStorage } = await import("@/lib/cloudStorage");
          fileUrl = await uploadFileToStorage(file, `posts/${content.id}-${Date.now()}-${file.name}`);
        } catch {}
        const id = uid();
        if (!fileUrl) {
          await saveLocalFile(id, file);
        }
        savedItems.push({ id, name: file.name, type: file.type, size: file.size, addedAt: todayStamp(), url: fileUrl });
      }
    } catch {
      setEditMediaError("Não foi possível salvar a mídia.");
      setEditSaving(false);
      return;
    }
    onUpdate((current) => {
      const media = editMediaFiles.length ? savedItems : editExistingMedia;
      return {
        ...(materialChanged ? revision(current, "Conteúdo alterado. Nova aprovação necessária.") : { ...current, activity: [{ id: uid(), author: "Equipe Nurea", action: "Dados de publicação atualizados", at: todayStamp(), version: current.version }, ...current.activity] }),
        category: editCategory.trim(), publishedUrl: editPublishedUrl.trim() || undefined, sharedToStory: editShared,
        title: editTitle.trim(), date: editDate, format: editFormat, caption: editCaption.trim(), cta: "", media,
        slides: editFormat === "carrossel" ? (media?.length ? undefined : current.slides ?? [editTitle.trim()]) : undefined,
      };
    });
    setSlideIndex(0);
    setEditSaving(false);
    setEditOpen(false);
  }
  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setFileError("");
    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) { setFileError("Cada arquivo deve ter no máximo 100 MB."); continue; }
      let fileUrl: string | undefined;
      try {
        const { uploadFileToStorage } = await import("@/lib/cloudStorage");
        fileUrl = await uploadFileToStorage(file, `attachments/${content.id}-${Date.now()}-${file.name}`);
      } catch {}
      const id = uid();
      try {
        if (!fileUrl) {
          await saveLocalFile(id, file);
        }
        onUpdate((current) => ({
          ...revision(current, `Anexo adicionado: ${file.name}`),
          attachments: [...(current.attachments ?? []), { id, name: file.name, type: file.type, size: file.size, addedAt: todayStamp(), url: fileUrl }],
        }));
      } catch { setFileError("Não foi possível salvar o arquivo."); }
    }
  }
  async function removeAttachment(id: string) {
    const item = content.attachments?.find((attachment) => attachment.id === id);
    if (!item || !window.confirm(`Remover ${item.name}?`)) return;
    if (selectedAttachmentId === id) setSelectedAttachmentId(null);
    onUpdate((current) => ({ ...revision(current, `Anexo removido: ${item.name}`), attachments: (current.attachments ?? []).filter((attachment) => attachment.id !== id) }));
    try { await deleteLocalFile(id); if (item.type.startsWith("video/")) await deleteLocalFile(`poster:${id}`); if (item.coverFileId) await deleteLocalFile(item.coverFileId); } catch { setFileError("O anexo saiu da publicação, mas não foi removido do armazenamento local."); }
  }
  async function uploadVideoCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const video = (selectedAttachmentId ? content.attachments?.find(item => item.id === selectedAttachmentId && item.type.startsWith("video/")) : null)
      || content.attachments?.find(item => item.type.startsWith("video/"))
      || content.media?.find(item => item.type.startsWith("video/"));
    if (!file || !video || coverSaving) return;
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      setFileError("Escolha uma imagem de até 20 MB para a capa.");
      return;
    }
    setCoverSaving(true);
    setFileError("");
    let coverUrl: string | undefined;
    try {
      const { uploadFileToStorage } = await import("@/lib/cloudStorage");
      coverUrl = await uploadFileToStorage(file, `covers/${content.id}-${Date.now()}-${file.name}`);
    } catch {}
    const id = uid();
    try {
      if (!coverUrl) {
        await saveLocalFile(id, file);
      }
      const coverAttachment: Attachment = {
        id,
        name: `Capa · ${file.name}`,
        type: file.type,
        size: file.size,
        addedAt: todayStamp(),
        url: coverUrl,
      };
      onUpdate((current) => {
        const existingAttachments = current.attachments ?? [];
        const filteredAttachments = existingAttachments.filter(
          (item) => item.id !== video.coverFileId && !item.name.startsWith("Capa · ")
        );
        const nextAttachments = [...filteredAttachments, coverAttachment].map((item) =>
          item.id === video.id
            ? { ...item, coverFileId: id, coverUrl: coverUrl ?? item.coverUrl, coverScale: 100, coverOffsetX: 0, coverOffsetY: 0 }
            : item
        );
        const nextMedia = (current.media ?? []).map((item) =>
          item.id === video.id
            ? { ...item, coverFileId: id, coverUrl: coverUrl ?? item.coverUrl, coverScale: 100, coverOffsetX: 0, coverOffsetY: 0 }
            : item
        );
        return {
          ...revision(current, `Capa do vídeo enviada como anexo: ${file.name}`),
          coverUrl: coverUrl,
          coverFileId: id,
          coverScale: 100,
          coverOffsetX: 0,
          coverOffsetY: 0,
          attachments: nextAttachments,
          media: nextMedia,
        };
      });
      if (video.coverFileId) await deleteLocalFile(video.coverFileId).catch(() => {});
      setCoverDraft({ scale: 100, x: 0, y: 0 });
      setCoverEditorOpen(true);
    } catch {
      await deleteLocalFile(id).catch(() => {});
      setFileError("Não foi possível salvar a capa.");
    } finally { setCoverSaving(false); }
  }
  function requestAdjustment(event: FormEvent) {
    event.preventDefault();
    if (!adjustText.trim()) return;
    onAction("ajuste", adjustTarget ? `Ajuste solicitado · ${adjustTarget}` : "Ajuste solicitado", adjustText.trim());
    setFeedback("Pedido enviado. A equipe verá seu comentário nesta versão.");
    setAdjustOpen(false);
    setAdjustText("");
    setAdjustTarget("");
  }
  const caption = [content.caption, content.cta].filter(Boolean).join("\n\n");
  const selectedAttachment = content.attachments?.find((item) => item.id === selectedAttachmentId) ?? null;

  const coverVideo = (selectedAttachment?.type.startsWith("video/") ? selectedAttachment : null)
    || content.attachments?.find(item => item.type.startsWith("video/"))
    || content.media?.find(item => item.type.startsWith("video/"));

  const currentCoverAttachment = (coverVideo?.coverFileId ? content.attachments?.find(a => a.id === coverVideo.coverFileId) : null)
    || (content.attachments?.find(a => a.name.startsWith("Capa · ")))
    || null;

  const coverDisplayUrl = (currentCoverAttachment?.id ? attachmentUrls[currentCoverAttachment.id] : undefined)
    || currentCoverAttachment?.url
    || coverVideo?.coverUrl
    || content.coverUrl;

  function setAttachmentAsCover(attachment: Attachment) {
    if (!coverVideo) return;
    const url = attachmentUrls[attachment.id] || attachment.url;
    onUpdate((current) => {
      const nextAttachments = (current.attachments ?? []).map((item) =>
        item.id === coverVideo.id ? { ...item, coverFileId: attachment.id, coverUrl: url ?? item.coverUrl } : item
      );
      const nextMedia = (current.media ?? []).map((item) =>
        item.id === coverVideo.id ? { ...item, coverFileId: attachment.id, coverUrl: url ?? item.coverUrl } : item
      );
      return {
        ...revision(current, `Capa do vídeo definida: ${attachment.name}`),
        coverUrl: url,
        coverFileId: attachment.id,
        attachments: nextAttachments,
        media: nextMedia,
      };
    });
    setFeedback(`"${attachment.name}" definida como capa do vídeo.`);
    setTimeout(() => setFeedback(""), 3000);
  }

  function openCoverEditor() {
    if (!coverDisplayUrl) {
      coverInputRef.current?.click();
      return;
    }
    const currentScale = coverVideo?.coverScale ?? content.coverScale ?? 100;
    const currentX = coverVideo?.coverOffsetX ?? content.coverOffsetX ?? 0;
    const currentY = coverVideo?.coverOffsetY ?? content.coverOffsetY ?? 0;
    setCoverDraft({
      scale: currentScale,
      x: currentX,
      y: currentY,
    });
    setCoverEditorOpen(true);
  }

  const instagramHandle = getInstagramHandle(clientSlug || clientName);
  const totalSlides = content.media?.length ?? content.slides?.length ?? 1;

  return <div className="modal-backdrop detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="content-detail" role="dialog" aria-modal="true" aria-label={`Publicação: ${content.title}`}>
      <div className="content-detail-top">
        <span className="section-kicker">{content.format === "story" ? `STORY ${position + 1}` : `POST ${content.postNumber}`} · {formatLabel[content.format].toUpperCase()}</span>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Fechar publicação"><X size={21} /></button>
      </div>
      <div className="content-detail-body" ref={bodyRef}>
        <div className="content-detail-date">
          <span className="date-icon"><CalendarDays size={21} /></span>
          <div><span>DATA DA POSTAGEM</span><strong>{fullDate(content.date)}</strong></div>
          {role === "equipe" && <button className="detail-inline-edit" onClick={() => { startEdit(); }}>Editar data</button>}
        </div>
        <div className="detail-quick-links"><button onClick={() => captionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Ver legenda</button><button onClick={() => attachmentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Anexos ({content.attachments?.length ?? 0})</button>{selectedAttachment && <button onClick={() => setSelectedAttachmentId(null)}>Voltar à publicação</button>}</div>
        <div className="content-detail-preview-col">
          <div className="insta-post-card">
            {/* Header */}
            <div className="insta-header">
              <div className="insta-header-user">
                <div className="insta-avatar">
                  {clientLogo ? (
                    <img src={clientLogo} alt={clientName} />
                  ) : (
                    <span>{clientName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
                  )}
                </div>
                <div className="insta-user-meta">
                  <span className="insta-username">{instagramHandle}</span>
                  <span className="insta-location">Áudio original · {clientName}</span>
                </div>
              </div>
              <div className="insta-header-actions">
                <button
                  type="button"
                  className={`insta-follow-btn ${following ? "is-following" : ""}`}
                  onClick={() => setFollowing((prev) => !prev)}
                >
                  {following ? "Seguindo" : "Seguir"}
                </button>
                <button type="button" className="insta-more-btn" aria-label="Opções">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Media Frame */}
            <div className={`insta-media-frame ${content.format === "story" ? "is-story" : ""}`}>
              <MediaPreview
                content={content}
                brand={clientName}
                mode="detail"
                slideIndex={slideIndex}
                attachment={selectedAttachment}
              />
              {!selectedAttachment && content.format === "carrossel" && totalSlides > 1 && (
                <>
                  <div className="insta-carousel-badge">
                    {slideIndex + 1}/{totalSlides}
                  </div>
                  {slideIndex > 0 && (
                    <button
                      type="button"
                      className="insta-carousel-arrow insta-carousel-prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex((prev) => Math.max(0, prev - 1));
                      }}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {slideIndex < totalSlides - 1 && (
                    <button
                      type="button"
                      className="insta-carousel-arrow insta-carousel-next"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
                      }}
                      aria-label="Próxima página"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Action Bar */}
            <div className="insta-action-bar">
              <div className="insta-actions-left">
                <button
                  type="button"
                  className={`insta-action-btn ${liked ? "is-liked" : ""}`}
                  onClick={() => setLiked((prev) => !prev)}
                  aria-label={liked ? "Descurtir" : "Curtir"}
                >
                  <Heart
                    size={24}
                    fill={liked ? "#ed4956" : "none"}
                    color={liked ? "#ed4956" : "#262626"}
                    strokeWidth={liked ? 0 : 2}
                  />
                </button>
                <button
                  type="button"
                  className="insta-action-btn"
                  onClick={() => {
                    captionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setCommentOpen(true);
                  }}
                  aria-label="Comentar"
                >
                  <MessageCircle size={24} color="#262626" />
                </button>
                <button
                  type="button"
                  className="insta-action-btn"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(content.publishedUrl || window.location.href);
                      setFeedback("Link da publicação copiado!");
                      setTimeout(() => setFeedback(""), 3000);
                    }
                  }}
                  aria-label="Compartilhar"
                >
                  <Send size={24} color="#262626" />
                </button>
              </div>

              {!selectedAttachment && content.format === "carrossel" && totalSlides > 1 && (
                <div className="insta-carousel-dots">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <span key={idx} className={`insta-dot ${idx === slideIndex ? "is-active" : ""}`} />
                  ))}
                </div>
              )}

              <div className="insta-actions-right">
                <button
                  type="button"
                  className={`insta-action-btn ${saved ? "is-saved" : ""}`}
                  onClick={() => setSaved((prev) => !prev)}
                  aria-label={saved ? "Salvo" : "Salvar"}
                >
                  <Bookmark size={24} fill={saved ? "#262626" : "none"} color="#262626" />
                </button>
              </div>
            </div>

            {/* Caption */}
            <div className="insta-caption-row">
              <p className="insta-caption-content">
                <strong className="insta-caption-author">{instagramHandle}</strong>{" "}
                <span>{content.title}</span>
              </p>
              {content.caption && (
                <p className="insta-caption-snippet">
                  {content.caption.length > 140 ? `${content.caption.slice(0, 140)}...` : content.caption}
                </p>
              )}
              <div className="insta-hashtags">
                <span>#agencianurea</span> <span>#marketingdigital</span> <span>#{instagramHandle}</span>
              </div>
              <span className="insta-time-stamp">HÁ 2 HORAS · VER TRADUÇÃO</span>
            </div>
          </div>
        </div>
        <div className="content-detail-columns">
          <div className="content-detail-main">
            <div className="content-detail-title"><div><span className="section-kicker">{content.category.toUpperCase()} · VERSÃO {content.version}</span><h2>{content.title}</h2></div><span className={`status-badge status-${content.status}`}><span className="status-dot" />{statusLabel[content.status]}</span></div>
            {editOpen && role === "equipe" ? <form className="edit-form content-edit" onSubmit={saveEdit}>
              <label>Título<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required /></label>
              <label>Categoria<input value={editCategory} onChange={event => setEditCategory(event.target.value)} /></label>
              <label>Tipo de conteúdo<select value={editFormat} onChange={(event) => { setEditFormat(event.target.value as ContentFormat); setEditMediaFiles([]); setEditMediaError(""); }}><option value="arte">Arte</option><option value="carrossel">Carrossel</option><option value="reels">Reels / vídeo</option><option value="story">Story original</option></select></label>
              <label>Data da postagem<input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} required /></label>
              <label>Legenda completa<textarea value={editCaption} onChange={(event) => setEditCaption(event.target.value)} rows={8} /></label>
              <label>Link da publicação<input type="url" value={editPublishedUrl} onChange={event => setEditPublishedUrl(event.target.value)} placeholder="https://www.instagram.com/p/..." /></label>
              {content.format !== "story" && <label className="inline-checkbox"><input type="checkbox" checked={editShared} onChange={event => setEditShared(event.target.checked)} /> Compartilhado no Story</label>}
              {editExistingMedia.length > 0 && <div className="media-edit-list"><strong>Mídia atual</strong>{editExistingMedia.map((item, index) => <div key={item.id}><span>{index + 1}. {item.name}</span><button type="button" className="text-button" disabled={index === 0} onClick={() => setEditExistingMedia(items => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} aria-label={`Mover ${item.name} para antes`}>↑</button><button type="button" className="text-button" onClick={() => setEditExistingMedia(items => items.filter(file => file.id !== item.id))} aria-label={`Remover mídia ${item.name}`}>Remover</button></div>)}</div>}
              <label htmlFor="edit-media">{content.media?.length ? "Substituir mídia da publicação" : "Mídia da publicação"}</label>
              <input id="edit-media" className="media-file-input" type="file" accept={mediaAccept(editFormat)} multiple={editFormat === "carrossel"} onChange={(event) => { setEditMediaFiles(Array.from(event.target.files ?? [])); setEditMediaError(""); }} />
              <p>{editFormat === "carrossel" ? "Até 10 imagens, na ordem selecionada." : editFormat === "reels" ? "Um vídeo de até 100 MB." : editFormat === "story" ? "Uma imagem ou vídeo." : "Uma imagem de até 20 MB."} {content.media?.length ? "Se não selecionar outro arquivo, a mídia atual será mantida quando compatível." : "Sem arquivo, permanece a capa ilustrativa."}</p>
              {editMediaFiles.length > 0 && <div className="selected-media"><strong>Nova mídia</strong>{editMediaFiles.map((file, index) => <span key={index}>{index + 1}. {file.name}</span>)}</div>}
              {editMediaError && <p className="file-error" role="alert">{editMediaError}</p>}
              <p>Alterar conteúdo, data ou arquivos cria uma nova versão em preparação, mesmo em posts publicados. Link e marca de compartilhamento são dados de acompanhamento.</p>
              <div><button type="button" className="text-button" onClick={() => setEditOpen(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={editSaving}>{editSaving ? "Salvando..." : "Salvar alterações"}</button></div>
            </form> : <>
              <div ref={captionRef} className="detail-section"><div className="detail-section-head"><FileText size={19} /><h3>Legenda</h3>{role === "equipe" && <button className="detail-inline-edit" onClick={startEdit}>Editar</button>}</div><div className="caption-block">{caption || "Legenda ainda não adicionada."}</div></div>
              <div ref={attachmentsRef} className="detail-section"><div className="detail-section-head"><Paperclip size={19} /><h3>Anexos</h3>{role === "equipe" && <><input ref={uploadRef} className="sr-only" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" onChange={uploadFiles} aria-label="Selecionar anexos" /><button className="detail-inline-edit" onClick={() => uploadRef.current?.click()}><Plus size={15} /> Adicionar</button></>}</div>
                {(content.attachments ?? []).length ? <div className="attachment-list">{content.attachments!.map((item) => {
                  const isImage = item.type.startsWith("image/");
                  const isVideo = item.type.startsWith("video/");
                  const isCurrentCover = Boolean(
                    coverVideo && (
                      coverVideo.coverFileId === item.id ||
                      (currentCoverAttachment && currentCoverAttachment.id === item.id) ||
                      (coverVideo.coverUrl && (coverVideo.coverUrl === item.url || (attachmentUrls[item.id] && coverVideo.coverUrl === attachmentUrls[item.id])))
                    )
                  );
                  return (
                    <div className="attachment-row" key={item.id}>
                      {isImage || isVideo ? (
                        <button
                          type="button"
                          className={`attachment-preview-button ${selectedAttachmentId === item.id ? "is-selected" : ""}`}
                          onClick={() => {
                            setSelectedAttachmentId(item.id);
                            bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          aria-label={`Pré-visualizar ${item.name}`}
                          aria-pressed={selectedAttachmentId === item.id}
                        >
                          {isImage && (attachmentUrls[item.id] || item.url) ? (
                            <img src={attachmentUrls[item.id] || item.url} alt="" />
                          ) : (
                            <span className="attachment-icon">
                              {isVideo ? <Play size={20} fill="currentColor" /> : <Paperclip size={20} />}
                            </span>
                          )}
                          <span className="attachment-copy">
                            <strong>{item.name}</strong>
                            <small>
                              {(item.size / 1024 / 1024).toFixed(1)} MB · {isVideo ? "Vídeo · toque para assistir" : "Imagem · toque para ampliar"}
                            </small>
                          </span>
                        </button>
                      ) : (
                        <>
                          <span className="attachment-icon"><Paperclip size={20} /></span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{(item.size / 1024 / 1024).toFixed(1)} MB · Arquivo</small>
                          </div>
                        </>
                      )}
                      {coverVideo && isImage && role === "equipe" && (
                        isCurrentCover ? (
                          <span className="attachment-cover-tag" title="Esta imagem está definida como capa do vídeo">
                            <Check size={11} /> Capa
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="attachment-set-cover-btn"
                            onClick={() => setAttachmentAsCover(item)}
                            title="Definir como capa do vídeo"
                          >
                            Usar como capa
                          </button>
                        )
                      )}
                      {(attachmentUrls[item.id] || item.url) && (
                        <a href={attachmentUrls[item.id] || item.url} download={item.name} aria-label={`Baixar ${item.name}`}>
                          <Download size={18} />
                        </a>
                      )}
                      {role === "equipe" && (
                        <button onClick={() => removeAttachment(item.id)} aria-label={`Remover ${item.name}`}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}</div> : <p className="detail-empty">Nenhum anexo nesta publicação.</p>}{fileError && <p className="file-error" role="alert">{fileError}</p>}
                {coverVideo && role === "equipe" && (
                  <div className="video-cover-actions">
                    <input
                      ref={coverInputRef}
                      className="sr-only"
                      type="file"
                      accept="image/*"
                      onChange={uploadVideoCover}
                      aria-label="Imagem de capa do vídeo"
                    />
                    <div className="video-cover-btn-group">
                      <button
                        type="button"
                        className="outline-button"
                        disabled={coverSaving}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {coverSaving ? "Salvando capa..." : (coverDisplayUrl ? "Trocar capa do vídeo" : "Selecionar capa do vídeo")}
                      </button>
                      {coverDisplayUrl && (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={openCoverEditor}
                        >
                          Ajustar enquadramento da capa (3:4)
                        </button>
                      )}
                    </div>
                    <p>
                      {coverDisplayUrl
                        ? "Capa personalizada vinculada aos anexos. Clique em 'Ajustar enquadramento' para reposicionar e aplicar zoom na prévia do feed."
                        : "Envie uma foto de capa para o vídeo. Ela será salva como anexo e exibida no feed e antes do play."}
                    </p>
                  </div>
                )}
              </div>
              {content.sharedToStory && <div className="shared-note"><CheckCircle2 size={16} /> Este post também foi compartilhado no Story.</div>}
              {content.status === "publicado" && content.publishedUrl && <a className="published-link" href={content.publishedUrl} target="_blank" rel="noopener noreferrer">Ver publicação no Instagram <ArrowRight size={15} /></a>}
            </>}
          </div>
          <aside className="content-detail-side"><div className="detail-section-head"><MessageCircle size={19} /><h3>Aprovação e atividade</h3></div>
            <div className="content-detail-actions" ref={interactionRef}>
              
              {role === "cliente" && adjustOpen && <form className="adjust-form" onSubmit={requestAdjustment}><label htmlFor="adjust-text">O que precisamos mudar?</label><textarea id="adjust-text" value={adjustText} onChange={(event) => setAdjustText(event.target.value)} rows={4} required /><label htmlFor="adjust-target">Parte do conteúdo (opcional)</label><select id="adjust-target" value={adjustTarget} onChange={(event) => setAdjustTarget(event.target.value)}><option value="">Publicação em geral</option><option value="arte ou vídeo">Arte ou vídeo</option><option value="legenda">Legenda</option><option value="capa">Capa</option><option value="carrossel">Página do carrossel</option></select><div><button type="button" className="text-button" onClick={() => setAdjustOpen(false)}>Cancelar</button><button className="primary-button" type="submit"><Send size={16} /> Enviar pedido</button></div></form>}
              {role === "cliente" && content.status !== "aguardando" && <p className="action-message">{content.status === "ajuste" ? "Seu pedido de ajuste foi enviado. A Nurea preparará uma nova versão." : content.status === "producao" ? "Conteúdo em preparação." : "Esta publicação não requer ação agora."}</p>}
              {role === "equipe" && !editOpen && <><button className="outline-button" onClick={startEdit}>Editar conteúdo e arquivos</button><button className="text-button danger-button" onClick={onDelete}>Excluir publicação</button>{(content.status === "producao" || content.status === "ajuste") && <button className="primary-button" onClick={() => onAction("aguardando", "Enviado para aprovação")}>Enviar para aprovação</button>}{content.status === "aprovado" && <button className="primary-button" onClick={() => onAction("agendado", "Agendamento registrado")}>Marcar agendado</button>}{content.status === "agendado" && <div className="publish-form"><label htmlFor="published-url">Link da publicação (opcional)</label><input id="published-url" type="url" value={publishUrl} onChange={(event) => setPublishUrl(event.target.value)} placeholder="https://www.instagram.com/p/..." /><button className="primary-button" onClick={() => { onUpdate((current) => ({ ...current, status: "publicado", publishedUrl: publishUrl.trim() || undefined, activity: [{ id: uid(), author: "Equipe Nurea", action: "Publicação confirmada", at: todayStamp(), version: current.version }, ...current.activity] })); setPublishUrl(""); }}>Confirmar publicação</button></div>}{content.status === "publicado" && content.format !== "story" && !content.sharedToStory && <button className="outline-button" onClick={() => onUpdate((current) => ({ ...current, sharedToStory: true, activity: [{ id: uid(), author: "Equipe Nurea", action: "Compartilhado no Story", at: todayStamp(), version: current.version }, ...current.activity] }))}>Marcar compartilhamento no Story</button>}</>}
            </div>
            {commentOpen && <form className="comment-form" onSubmit={event => { event.preventDefault(); if (!comment.trim()) return; onAction(content.status, "Comentário", comment.trim()); setComment(""); setCommentOpen(false); setFeedback("Comentário enviado."); }}><label htmlFor="post-comment">Seu comentário</label><textarea id="post-comment" value={comment} onChange={event => setComment(event.target.value)} rows={3} required autoFocus /><p>Comentar não altera a aprovação do post.</p><div><button type="button" className="text-button" onClick={() => setCommentOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Enviar comentário</button></div></form>}
            <div className="content-detail-history"><h4>Histórico</h4>{content.activity.length ? content.activity.map((activity) => <div className="activity-item" key={activity.id}><span className="activity-mark" /><div><strong>{activity.action}</strong><small>{activity.author} · {formatActivityDate(activity.at)} · v{activity.version}</small>{activity.note && <p>{activity.note}</p>}</div></div>) : <p className="detail-empty">Ainda não há interações.</p>}</div>
          </aside>
        </div>
        <div className="content-detail-nav"><button onClick={() => { setSlideIndex(0); onNavigate(-1); }} disabled={position <= 0}><ArrowLeft size={17} /> Anterior</button><span>{position + 1} / {total}</span><button onClick={() => { setSlideIndex(0); onNavigate(1); }} disabled={position >= total - 1}>Próxima <ArrowRight size={17} /></button></div>
      </div>
      <div className="review-action-bar">
        <div className="review-feedback" role="status" aria-live="polite">{feedback || (content.status === "aprovado" ? "✓ Aprovado. Sua aprovação foi registrada." : content.status === "aguardando" ? "Confira a arte, a legenda e os anexos." : statusLabel[content.status])}</div>
        <div className="review-buttons">
          {role === "cliente" && content.status === "aguardando" && <button className="primary-button approve-button" onClick={() => { onAction("aprovado", "Conteúdo aprovado"); setAdjustOpen(false); setFeedback("✓ Aprovado! O feed já foi atualizado."); }}><CheckCircle2 size={19} /> Aprovar post</button>}
          {role === "cliente" && content.status !== "producao" && <button className="outline-button" onClick={() => { setAdjustOpen(true); setCommentOpen(false); }}>Pedir ajuste</button>}
          <button className="outline-button" onClick={() => { setCommentOpen(true); setAdjustOpen(false); requestAnimationFrame(() => dialogRef.current?.querySelector(".comment-form")?.scrollIntoView({ behavior: "smooth", block: "center" })); }}><MessageCircle size={16} /> Comentar</button>
          {role === "equipe" && <button className="primary-button" onClick={startEdit}>Editar post</button>}
        </div>
      </div>
      {coverEditorOpen && (
        <div className="cover-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setCoverEditorOpen(false); }}>
          <section className="cover-modal" role="dialog" aria-modal="true" aria-labelledby="cover-modal-title">
            <button
              type="button"
              className="icon-button cover-modal-close"
              onClick={() => setCoverEditorOpen(false)}
              aria-label="Fechar ajuste de capa"
            >
              <X size={20} />
            </button>
            <span className="section-kicker">ENQUADRAMENTO DO FEED (3:4)</span>
            <h2 id="cover-modal-title">Ajustar capa do vídeo</h2>
            <p className="cover-modal-hint">
              Arraste a imagem para reposicionar e ajuste o zoom para definir como ela ficará na prévia do feed.
            </p>

            <div
              className="cover-modal-preview cover-modal-preview-draggable"
              onPointerDown={(event) => {
                if (!coverDisplayUrl) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                coverDragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  offsetX: coverDraft.x,
                  offsetY: coverDraft.y,
                };
              }}
              onPointerMove={(event) => {
                const start = coverDragRef.current;
                if (!start) return;
                const rect = event.currentTarget.getBoundingClientRect();
                setCoverDraft((draft) => ({
                  ...draft,
                  x: Math.max(-100, Math.min(100, start.offsetX + ((event.clientX - start.x) / rect.width) * 100)),
                  y: Math.max(-100, Math.min(100, start.offsetY + ((event.clientY - start.y) / rect.height) * 100)),
                }));
              }}
              onPointerUp={() => { coverDragRef.current = null; }}
              onPointerCancel={() => { coverDragRef.current = null; }}
            >
              {coverDisplayUrl ? (
                <img
                  src={coverDisplayUrl}
                  alt="Prévia do enquadramento"
                  draggable={false}
                  style={{
                    transform: `translate(${coverDraft.x}%, ${coverDraft.y}%) scale(${coverDraft.scale / 100})`,
                    transformOrigin: "center center",
                  }}
                />
              ) : (
                <div className="cover-modal-no-img">Nenhuma foto de capa selecionada</div>
              )}
              <div className="cover-modal-grid-overlay" aria-hidden="true">
                <div className="grid-line-h1" />
                <div className="grid-line-h2" />
                <div className="grid-line-v1" />
                <div className="grid-line-v2" />
              </div>
            </div>

            <div className="cover-modal-controls">
              <label htmlFor="cover-scale">
                Zoom <strong>{coverDraft.scale}%</strong>
              </label>
              <input
                id="cover-scale"
                type="range"
                min="100"
                max="250"
                step="1"
                value={coverDraft.scale}
                onChange={(event) =>
                  setCoverDraft((draft) => ({ ...draft, scale: Number(event.target.value) }))
                }
              />
              <div className="cover-modal-helpers">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCoverDraft({ scale: 100, x: 0, y: 0 })}
                >
                  Restaurar enquadramento
                </button>
              </div>
              <div className="cover-modal-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setCoverEditorOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    const roundedScale = Math.round(coverDraft.scale);
                    const roundedX = Math.round(coverDraft.x);
                    const roundedY = Math.round(coverDraft.y);
                    onUpdate((current) => {
                      const nextAttachments = (current.attachments ?? []).map((item) =>
                        item.id === coverVideo?.id || (currentCoverAttachment && item.id === currentCoverAttachment.id)
                          ? { ...item, coverScale: roundedScale, coverOffsetX: roundedX, coverOffsetY: roundedY }
                          : item
                      );
                      const nextMedia = (current.media ?? []).map((item) =>
                        item.id === coverVideo?.id
                          ? { ...item, coverScale: roundedScale, coverOffsetX: roundedX, coverOffsetY: roundedY }
                          : item
                      );
                      return {
                        ...current,
                        coverScale: roundedScale,
                        coverOffsetX: roundedX,
                        coverOffsetY: roundedY,
                        attachments: nextAttachments,
                        media: nextMedia,
                      };
                    });
                    setCoverEditorOpen(false);
                    setFeedback("Enquadramento salvo com sucesso!");
                    setTimeout(() => setFeedback(""), 3000);
                  }}
                >
                  Aplicar enquadramento
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  </div>;
}
