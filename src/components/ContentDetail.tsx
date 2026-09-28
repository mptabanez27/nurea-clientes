"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, MessageCircle, Paperclip, Play, Plus, Send, X } from "lucide-react";
import MediaPreview from "./MediaPreview";
import { Content, ContentFormat, ContentStatus, formatActivityDate, formatLabel, statusLabel, todayStamp } from "@/lib/demo";
import { deleteLocalFile, getLocalFile, saveLocalFile } from "@/lib/localFiles";
import { mediaAccept, mediaIsCompatible, validateMediaFiles } from "@/lib/media";

type Props = {
  content: Content;
  clientName: string;
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
function revision(content: Content, note: string): Content {
  const version = content.version + 1;
  return {
    ...content,
    version,
    status: "producao",
    activity: [{ id: uid(), author: "Equipe Nurea", action: "Nova versão criada", note, at: todayStamp(), version }, ...content.activity],
  };
}

export default function ContentDetail({ content, clientName, role, position, total, onClose, onDelete, onNavigate, onUpdate, onAction }: Props) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
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

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    if (adjustOpen || commentOpen) {
      interactionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      interactionRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
    }
  }, [adjustOpen, commentOpen]);
  useEffect(() => { if (editOpen) dialogRef.current?.querySelector(".content-edit")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [editOpen]);
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
    const savedIds: string[] = [];
    try {
      for (const file of editMediaFiles) {
        const id = uid();
        await saveLocalFile(id, file);
        savedIds.push(id);
      }
    } catch {
      for (const id of savedIds) await deleteLocalFile(id).catch(() => {});
      setEditMediaError("Não foi possível salvar a mídia neste navegador. Tente um arquivo menor.");
      setEditSaving(false);
      return;
    }
    onUpdate((current) => {
      const media = editMediaFiles.length ? editMediaFiles.map((file, index) => ({ id: savedIds[index], name: file.name, type: file.type, size: file.size, addedAt: todayStamp() })) : editExistingMedia;
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
      if (file.size > 100 * 1024 * 1024) { setFileError("Cada arquivo deve ter no máximo 100 MB nesta demonstração."); continue; }
      const id = uid();
      try {
        await saveLocalFile(id, file);
        onUpdate((current) => ({
          ...revision(current, `Anexo adicionado: ${file.name}`),
          attachments: [...(current.attachments ?? []), { id, name: file.name, type: file.type, size: file.size, addedAt: todayStamp() }],
        }));
      } catch { setFileError("Não foi possível salvar o arquivo neste navegador."); }
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
    const video = content.attachments?.find((item) => item.id === selectedAttachmentId && item.type.startsWith("video/"));
    if (!file || !video || coverSaving) return;
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      setFileError("Escolha uma imagem de até 20 MB para a capa.");
      return;
    }
    setCoverSaving(true);
    setFileError("");
    const id = uid();
    try {
      await saveLocalFile(id, file);
      onUpdate((current) => ({
        ...revision(current, `Capa do vídeo alterada: ${video.name}`),
        attachments: (current.attachments ?? []).map((item) => item.id === video.id ? { ...item, coverFileId: id } : item),
      }));
      if (video.coverFileId) await deleteLocalFile(video.coverFileId).catch(() => {});
    } catch {
      await deleteLocalFile(id).catch(() => {});
      setFileError("Não foi possível salvar a capa neste navegador.");
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
        <div className="content-detail-cover">
          <div className={`content-detail-art ${content.format === "story" ? "is-story" : ""}`}>
            <MediaPreview content={content} brand={clientName} mode="detail" slideIndex={slideIndex} attachment={selectedAttachment} />
          </div>
          {!selectedAttachment && content.format === "carrossel" && (content.media?.length ?? content.slides?.length ?? 0) > 1 && <div className="content-detail-carousel"><button onClick={() => setSlideIndex(Math.max(0, slideIndex - 1))} disabled={slideIndex === 0} aria-label="Página anterior"><ChevronLeft size={20} /></button><span>{slideIndex + 1} / {content.media?.length ?? content.slides?.length}</span><button onClick={() => setSlideIndex(Math.min((content.media?.length ?? content.slides?.length ?? 1) - 1, slideIndex + 1))} disabled={slideIndex === (content.media?.length ?? content.slides?.length ?? 1) - 1} aria-label="Próxima página"><ChevronRight size={20} /></button></div>}
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
              <div><button type="button" className="text-button" onClick={() => setEditOpen(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={editSaving}>{editSaving ? "Salvando..." : "Salvar nova versão"}</button></div>
            </form> : <>
              <div className="detail-section"><div className="detail-section-head"><FileText size={19} /><h3>Legenda</h3>{role === "equipe" && <button className="detail-inline-edit" onClick={startEdit}>Editar</button>}</div><div className="caption-block">{caption || "Legenda ainda não adicionada."}</div></div>
              <div className="detail-section"><div className="detail-section-head"><Paperclip size={19} /><h3>Anexos</h3>{role === "equipe" && <><input ref={uploadRef} className="sr-only" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" onChange={uploadFiles} aria-label="Selecionar anexos" /><button className="detail-inline-edit" onClick={() => uploadRef.current?.click()}><Plus size={15} /> Adicionar</button></>}</div>
                {(content.attachments ?? []).length ? <div className="attachment-list">{content.attachments!.map((item) => <div className="attachment-row" key={item.id}>{item.type.startsWith("image/") || item.type.startsWith("video/") ? <button type="button" className={`attachment-preview-button ${selectedAttachmentId === item.id ? "is-selected" : ""}`} onClick={() => { setSelectedAttachmentId(item.id); bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={`Pré-visualizar ${item.name}`} aria-pressed={selectedAttachmentId === item.id}>{item.type.startsWith("image/") && attachmentUrls[item.id] ? <img src={attachmentUrls[item.id]} alt="" /> : <span className="attachment-icon">{item.type.startsWith("video/") ? <Play size={20} fill="currentColor" /> : <Paperclip size={20} />}</span>}<span className="attachment-copy"><strong>{item.name}</strong><small>{(item.size / 1024 / 1024).toFixed(1)} MB · {item.type.startsWith("video/") ? "Vídeo · toque para assistir" : "Imagem · toque para ampliar"}</small></span></button> : <><span className="attachment-icon"><Paperclip size={20} /></span><div><strong>{item.name}</strong><small>{(item.size / 1024 / 1024).toFixed(1)} MB · Arquivo</small></div></>}{attachmentUrls[item.id] && <a href={attachmentUrls[item.id]} download={item.name} aria-label={`Baixar ${item.name}`}><Download size={18} /></a>}{role === "equipe" && <button onClick={() => removeAttachment(item.id)} aria-label={`Remover ${item.name}`}><X size={18} /></button>}</div>)}</div> : <p className="detail-empty">Nenhum anexo nesta publicação.</p>}{fileError && <p className="file-error" role="alert">{fileError}</p>}
                {selectedAttachment?.type.startsWith("video/") && role === "equipe" && <div className="video-cover-actions"><input ref={coverInputRef} className="sr-only" type="file" accept="image/*" onChange={uploadVideoCover} aria-label="Imagem de capa do vídeo" /><button type="button" className="outline-button" disabled={coverSaving} onClick={() => coverInputRef.current?.click()}>{coverSaving ? "Salvando capa..." : selectedAttachment.coverFileId ? "Trocar capa do vídeo" : "Selecionar capa do vídeo"}</button><p>{selectedAttachment.coverFileId ? "Capa personalizada aplicada. Ela aparece antes do play e na prévia do feed quando este vídeo é a capa da publicação." : "Envie uma imagem para aparecer antes do play. O vídeo continua igual."}</p></div>}
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
    </section>
  </div>;
}
