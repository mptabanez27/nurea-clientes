"use client";

import { useEffect, useRef, useState } from "react";
import MediaPreview from "./MediaPreview";
import ContentDetail from "./ContentDetail";
import PlanDocument from "./PlanDocument";
import { deleteLocalFile, getLocalFile, saveLocalFile } from "@/lib/localFiles";
import { mediaAccept, validateMediaFiles } from "@/lib/media";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  FileText,
  Grid3X3,
  LayoutGrid,
  Link2,
  List,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  Content,
  ContentFormat,
  ContentStatus,
  Workspace,
  ensurePostNumbers,
  formatActivityDate,
  formatDate,
  formatLabel,
  defaultClientId,
  demoClients,
  initialWorkspaces,
  planStatusLabel,
  statusLabel,
  todayStamp,
} from "@/lib/demo";

type View = "feed" | "stories" | "planejamento";
type Role = "cliente" | "equipe";
type FeedMode = "grid" | "list";
const storageKey = "nurea-clientes-demo-v2";
const shortStatus: Record<ContentStatus, string> = { producao: "Em preparação", aguardando: "Aguardando", ajuste: "Em ajuste", aprovado: "Aprovado", agendado: "Agendado", publicado: "Publicado" };

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function StatusBadge({ status }: { status: ContentStatus | Workspace["plan"]["status"] }) {
  const label = status in statusLabel ? statusLabel[status as ContentStatus] : planStatusLabel[status as Workspace["plan"]["status"]];
  return <span className={`status-badge status-${status}`}><span className="status-dot" />{label}</span>;
}

export type PortalProps = {
  initialClientId?: string;
  initialRole?: Role;
  fixedRole?: boolean;
  fixedClient?: boolean;
  clientToken?: string;
  availableClients?: { id: string; name: string; access_token?: string }[];
};

export default function Portal({
  initialClientId,
  initialRole,
  fixedRole = false,
  fixedClient = false,
  clientToken,
  availableClients,
}: PortalProps = {}) {
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>(initialWorkspaces);
  const [clientId, setClientId] = useState(initialClientId ?? defaultClientId);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRole] = useState<Role>(fixedRole ? "cliente" : (initialRole ?? "cliente"));
  const [clientsList, setClientsList] = useState<{ id: string; name: string; access_token?: string }[]>(
    availableClients ?? demoClients.map(c => ({ id: c.id, name: c.name }))
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [view, setView] = useState<View>("feed");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("grid");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planAdjustOpen, setPlanAdjustOpen] = useState(false);
  const [planAdjustText, setPlanAdjustText] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFormat, setNewFormat] = useState<ContentFormat>("arte");
  const [newDate, setNewDate] = useState("2026-09-30");
  const [newCaption, setNewCaption] = useState("");
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [newMediaError, setNewMediaError] = useState("");
  const [newSaving, setNewSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<{ id: string; url: string } | null>(null);
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [logoDraft, setLogoDraft] = useState({ scale: 100, x: 0, y: 0, border: false });
  const [logoError, setLogoError] = useState("");
  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [newMonthKey, setNewMonthKey] = useState("2026-10");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoButtonRef = useRef<HTMLButtonElement>(null);
  const logoModalCloseRef = useRef<HTMLButtonElement>(null);
  const logoDragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const workspace = workspaces[clientId] ?? initialWorkspaces[defaultClientId];
  const logoUrl = logoPreview && logoPreview.id === workspace.logoFileId ? logoPreview.url : null;
  const activeMonthKey = workspace.monthKey ?? "2026-09";
  const monthKeys = Array.from(new Set([...Object.keys(workspace.months ?? {}), activeMonthKey])).sort().reverse();

  function monthName(key: string) {
    const [year, month] = key.split("-").map(Number);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function copyClientLink() {
    const current = clientsList.find((c) => c.id === clientId);
    const demoClient = demoClients.find((c) => c.id === clientId);
    const token = clientToken || (current as any)?.access_token || demoClient?.accessToken;
    if (!token) {
      alert("Token de acesso exclusivo ainda não disponível para este cliente.");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://cliente.agencianurea.com.br";
    const fullUrl = `${origin}/c/${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {
        window.prompt("Copie o link exclusivo de acesso:", fullUrl);
      });
    } else {
      window.prompt("Copie o link exclusivo de acesso:", fullUrl);
    }
  }

  async function handleCreateClient() {
    const name = window.prompt("Nome do novo cliente:");
    if (!name || !name.trim()) return;
    try {
      const { createClient } = await import("@/lib/db");
      const created = await createClient(name.trim());
      if (created) {
        const newEntry = { id: created.id, name: created.name, access_token: created.access_token };
        setClientsList((prev) => [...prev, newEntry]);
        const newWorkspace: Workspace = {
          clientName: created.name,
          month: "Setembro de 2026",
          monthKey: "2026-09",
          plan: { status: "rascunho", version: 1, activity: [] },
          contents: [],
          nextPostNumber: 1,
        };
        setWorkspaces((prev) => ({ ...prev, [created.id]: newWorkspace }));
        setClientId(created.id);
        setSelectedId(null);
        setClientMenuOpen(false);
        setMenuOpen(false);
        setNewOpen(false);
        setPlanAdjustOpen(false);
        setLogoEditorOpen(false);
        setNewMonthOpen(false);
        setView("feed");
        setPendingOnly(false);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar cliente.");
    }
  }

  function switchMonth(nextKey: string, create = false) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nextKey)) return;
    if (!create && !monthKeys.includes(nextKey)) return;
    if (nextKey === activeMonthKey) { setNewMonthOpen(false); return; }
    setWorkspace((prev) => {
      const currentKey = prev.monthKey ?? "2026-09";
      const months = { ...prev.months, [currentKey]: { plan: prev.plan, contents: prev.contents, nextPostNumber: prev.nextPostNumber } };
      const target: import("@/lib/demo").MonthCycle = months[nextKey] ?? { plan: { status: "rascunho" as const, version: 1, activity: [] }, contents: [] };
      return { ...prev, monthKey: nextKey, month: monthName(nextKey), months, plan: target.plan, contents: target.contents, nextPostNumber: target.nextPostNumber };
    });
    setSelectedId(null);
    setNewOpen(false);
    setNewMonthOpen(false);
    setView("feed");
    setPendingOnly(false);
  }

  function openLogo() {
    if (!workspace.logoFileId && role === "equipe") { logoInputRef.current?.click(); return; }
    setLogoDraft({ scale: workspace.logoScale ?? 100, x: workspace.logoOffsetX ?? 0, y: workspace.logoOffsetY ?? 0, border: workspace.logoBorder ?? false });
    setLogoEditorOpen(true);
  }

  function closeLogo() {
    setLogoEditorOpen(false);
    requestAnimationFrame(() => logoButtonRef.current?.focus());
  }

  useEffect(() => {
    if (!logoEditorOpen) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    logoModalCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeLogo(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = priorOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [logoEditorOpen]);

  function setWorkspace(update: Workspace | ((previous: Workspace) => Workspace)) {
    setWorkspaces((previous) => {
      const current = previous[clientId] ?? initialWorkspaces[clientId];
      return { ...previous, [clientId]: typeof update === "function" ? update(current) : update };
    });
  }

  useEffect(() => {
    let active = true;
    async function syncCloud() {
      try {
        const { loadWorkspaceData, getAllClients } = await import("@/lib/db");
        if (!availableClients && !fixedClient) {
          const all = await getAllClients();
          if (active && all && all.length > 0) {
            setClientsList(all.map((c) => ({ id: c.id, name: c.name, access_token: c.access_token })));
          }
        }
        const cloudData = await loadWorkspaceData(clientId, activeMonthKey);
        if (active && cloudData) {
          setWorkspaces((prev) => ({ ...prev, [clientId]: cloudData }));
        }
      } catch (err) {
        console.warn("Sync com Supabase falhou, usando dados locais:", err);
      }
    }
    syncCloud();
    return () => { active = false; };
  }, [clientId, activeMonthKey, availableClients, fixedClient]);

  useEffect(() => {
    if (fixedRole) {
      setHydrated(true);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { clientId?: string; role?: Role; workspaces?: Record<string, Workspace> };
        if (parsed?.workspaces) {
          const restored = { ...initialWorkspaces };
          for (const client of demoClients) {
            const candidate = parsed.workspaces[client.id];
            if (candidate?.plan && Array.isArray(candidate.contents)) {
              const months = candidate.months && Object.fromEntries(Object.entries(candidate.months).map(([key, cycle]) => [key, { ...cycle, contents: ensurePostNumbers(cycle.contents) }]));
              restored[client.id] = { ...candidate, months, contents: ensurePostNumbers(candidate.contents), clientName: client.name };
            }
          }
          setWorkspaces((prev) => ({ ...restored, ...prev }));
        }
        if (!initialClientId && parsed?.clientId && (demoClients.some((client) => client.id === parsed.clientId) || clientsList.some(c => c.id === parsed.clientId))) {
          setClientId(parsed.clientId);
        }
        if (!initialRole && (parsed?.role === "equipe" || parsed?.role === "cliente")) {
          setRole(parsed.role);
        }
      }
    } catch {
      // Corrupt or unavailable local demo state is safely ignored.
    }
    setHydrated(true);
  }, [fixedRole, initialClientId, initialRole]);

  useEffect(() => {
    if (!hydrated || fixedRole) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ clientId, role, workspaces })); } catch { /* demo stays usable without persistence */ }
  }, [clientId, role, workspaces, hydrated, fixedRole]);

  useEffect(() => {
    if (!newOpen) { setNewMediaFiles([]); setNewMediaError(""); }
  }, [newOpen]);

  useEffect(() => {
    const id = workspace.logoFileId;
    setLogoPreview(null);
    setLogoError("");
    if (!id) return;
    if (id.startsWith("http://") || id.startsWith("https://")) {
      setLogoPreview({ id, url: id });
      return;
    }
    let active = true;
    let url: string | null = null;
    getLocalFile(id).then((blob) => {
      if (!active || !blob) return;
      url = URL.createObjectURL(blob);
      setLogoPreview({ id, url });
    }).catch(() => setLogoError("Não foi possível carregar a logo neste navegador."));
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [clientId, workspace.logoFileId]);

  function changeClient(nextId: string) {
    if (!clientsList.some((client) => client.id === nextId) && !demoClients.some((c) => c.id === nextId)) return;
    setClientId(nextId);
    setSelectedId(null);
    setClientMenuOpen(false);
    setMenuOpen(false);
    setNewOpen(false);
    setPlanAdjustOpen(false);
    setLogoEditorOpen(false);
    setNewMonthOpen(false);
    setView("feed");
    setPendingOnly(false);
    lastTriggerRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setLogoError("Escolha uma imagem de até 5 MB."); return; }
    setLogoError("");
    try {
      let logoUrl: string | undefined;
      try {
        const { uploadFileToStorage } = await import("@/lib/cloudStorage");
        logoUrl = await uploadFileToStorage(file, `logos/${clientId}-${Date.now()}-${file.name}`);
      } catch {}
      const id = logoUrl || uid();
      if (!logoUrl) {
        await saveLocalFile(id, file);
      }
      setWorkspace((prev) => ({ ...prev, logoFileId: id, logoScale: 100, logoOffsetX: 0, logoOffsetY: 0, logoBorder: false }));
      setLogoDraft({ scale: 100, x: 0, y: 0, border: false });
      setLogoEditorOpen(true);
      if (logoUrl) {
        const { updateClientLogoSettings } = await import("@/lib/db");
        await updateClientLogoSettings(clientId, { logo_url: logoUrl, logo_scale: 100, logo_offset_x: 0, logo_offset_y: 0, logo_border: false });
      }
    } catch { setLogoError("Não foi possível salvar a logo."); }
  }

  const feedContents = workspace.contents.filter((content) => content.format !== "story");
  const storyContents = workspace.contents.filter((content) => content.format === "story");
  const visibleFeed = ensurePostNumbers(feedContents)
    .filter((content) => role === "equipe" || content.status !== "producao")
    .sort((a, b) => (a.postNumber ?? 0) - (b.postNumber ?? 0));
  const visibleStories = storyContents.filter((content) => role === "equipe" || content.status !== "producao");
  const displayedFeed = pendingOnly ? visibleFeed.filter(content => content.status === "aguardando") : visibleFeed;
  const pendingCount = visibleFeed.filter(content => content.status === "aguardando").length;
  const selected = workspace.contents.find((content) => content.id === selectedId) ?? null;
  const currentList = selected?.format === "story" ? visibleStories : visibleFeed;
  const selectedPosition = selected ? currentList.findIndex((content) => content.id === selected.id) : -1;
  const summaryStatuses: ContentStatus[] = role === "equipe"
    ? ["aguardando", "ajuste", "producao", "aprovado", "agendado", "publicado"]
    : ["aguardando", "ajuste", "aprovado", "agendado", "publicado"];

  function navigate(next: View) {
    setView(next);
    setMenuOpen(false);
    setSelectedId(null);
  }

  function openDetail(id: string, trigger?: HTMLElement) {
    lastTriggerRef.current = trigger ?? null;
    setSelectedId(id);
  }

  function closeDetail() {
    setSelectedId(null);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  function updateContent(id: string, transform: (content: Content) => Content) {
    setWorkspace((prev) => {
      let updatedItem: Content | undefined;
      const nextContents = prev.contents.map((content) => {
        if (content.id !== id) return content;
        const updated = transform(content);
        if (updated.format === "story" || updated.postNumber) {
          updatedItem = updated;
          return updated;
        }
        const nextNumber = Math.max(prev.nextPostNumber ?? 1, prev.contents.reduce((max, item) => Math.max(max, item.postNumber ?? 0), 0) + 1);
        updatedItem = { ...updated, postNumber: nextNumber };
        return updatedItem;
      });
      if (updatedItem) {
        import("@/lib/db").then(({ saveContentRecord }) => {
          saveContentRecord(clientId, activeMonthKey, updatedItem!);
        }).catch(console.error);
      }
      return { ...prev, contents: nextContents };
    });
  }

  function actionOnContent(id: string, status: ContentStatus, action: string, note?: string) {
    updateContent(id, (content) => ({
      ...content,
      status,
      activity: [{ id: uid(), author: role === "cliente" ? "Cliente" : "Equipe Nurea", action, note, at: todayStamp(), version: content.version }, ...content.activity],
    }));
    import("@/lib/db").then(({ saveContentRecord, addActivityRecord }) => {
      saveContentRecord(clientId, activeMonthKey, { id, status } as any).catch(console.error);
      addActivityRecord(id, role === "cliente" ? "Cliente" : "Equipe Nurea", action, note, selected?.version || 1).catch(console.error);
    }).catch(console.error);
  }

  async function createContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !newDate || newSaving) return;
    const error = validateMediaFiles(newMediaFiles, newFormat);
    if (error) { setNewMediaError(error); return; }
    setNewSaving(true);
    setNewMediaError("");
    const savedMedia: import("@/lib/demo").Attachment[] = [];
    try {
      for (const file of newMediaFiles) {
        let fileUrl: string | undefined;
        try {
          const { uploadFileToStorage } = await import("@/lib/cloudStorage");
          fileUrl = await uploadFileToStorage(file, `posts/${clientId}-${Date.now()}-${file.name}`);
        } catch {}
        const id = uid();
        if (!fileUrl) {
          await saveLocalFile(id, file);
        }
        savedMedia.push({ id, name: file.name, type: file.type, size: file.size, addedAt: todayStamp(), url: fileUrl });
      }
    } catch {
      setNewMediaError("Não foi possível salvar a mídia.");
      setNewSaving(false);
      return;
    }
    const nextPostNum = newFormat !== "story" ? Math.max(workspace.nextPostNumber ?? 1, workspace.contents.reduce((max, item) => Math.max(max, item.postNumber ?? 0), 0) + 1) : undefined;
    const newId = uid();
    const content: Content = {
      id: newId,
      ...(nextPostNum ? { postNumber: nextPostNum } : {}),
      title: newTitle.trim(),
      category: "Novo conteúdo",
      format: newFormat,
      date: newDate,
      status: "producao",
      caption: newCaption.trim(),
      cta: "",
      cover: Math.floor(Math.random() * 9) + 1,
      version: 1,
      activity: [],
      media: savedMedia,
      attachments: savedMedia,
      ...(newFormat === "carrossel" ? { slides: [newTitle.trim()] } : {}),
    };
    setWorkspace((prev) => ({ ...prev, contents: [...prev.contents, content], nextPostNumber: Math.max(prev.nextPostNumber ?? 1, (content.postNumber ?? 0) + 1) }));
    setNewOpen(false);
    setNewTitle("");
    setNewCaption("");
    setNewMediaFiles([]);
    setNewSaving(false);
    setView(newFormat === "story" ? "stories" : "feed");
    requestAnimationFrame(() => openDetail(content.id));

    import("@/lib/db").then(({ saveContentRecord }) => {
      saveContentRecord(clientId, activeMonthKey, content);
    }).catch(console.error);
  }

  function updatePlan(status: Workspace["plan"]["status"], action: string, note?: string) {
    setWorkspace((prev) => {
      const nextVersion = prev.plan.status !== status ? prev.plan.version + 1 : prev.plan.version;
      const activity: import("@/lib/demo").Activity = { id: uid(), author: role === "cliente" ? "Cliente" : "Equipe Nurea", action, note, at: todayStamp(), version: nextVersion };
      return { ...prev, plan: { ...prev.plan, status, version: nextVersion, activity: [activity, ...prev.plan.activity] } };
    });
    setPlanAdjustOpen(false);
    setPlanAdjustText("");
    import("@/lib/db").then(({ updatePlanStatusRecord }) => {
      updatePlanStatusRecord(clientId, activeMonthKey, status, action, role === "cliente" ? "Cliente" : "Equipe Nurea", note);
    }).catch(console.error);
  }

  function restoreDemo() {
    if (!window.confirm("Restaurar os cinco clientes desta demonstração local?")) return;
    setWorkspaces(initialWorkspaces);
    setClientId(defaultClientId);
    setSelectedId(null);
    setClientMenuOpen(false);
    setLogoEditorOpen(false);
    setNewMonthOpen(false);
    setView("feed");
    setPendingOnly(false);
  }

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <aside inert={!!selected} className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="Navegação principal">
        <div className="sidebar-head">
          <div className="brand">
            <img src="/brand/logopng1.svg" alt="Nurea" width="172" height="50" />
          </div>
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <div className="client-switcher">
          {!fixedClient && role === "equipe" ? <>
            <button className="sidebar-client client-switch-button" onClick={() => setClientMenuOpen((open) => !open)} aria-expanded={clientMenuOpen} aria-controls="client-options" aria-label={`Trocar cliente. Atual: ${workspace.clientName}`}>
              <span>ESPAÇO DO CLIENTE</span><strong>{workspace.clientName}</strong><small>Trocar cliente <ChevronsUpDown size={14} /></small>
            </button>
            {clientMenuOpen && <div className="client-options" id="client-options" aria-label="Clientes">
              {clientsList.map((client) => <button key={client.id} className={client.id === clientId ? "selected" : ""} onClick={() => changeClient(client.id)} aria-current={client.id === clientId ? "true" : undefined}><span>{client.name}</span>{client.id === clientId && <Check size={16} />}</button>)}
              <button
                type="button"
                className="outline-button"
                style={{ margin: "8px 12px", width: "calc(100% - 24px)", fontSize: "11px", minHeight: "36px" }}
                onClick={handleCreateClient}
              >
                <Plus size={14} /> Novo cliente
              </button>
            </div>}
          </> : <div className="sidebar-client"><span>ESPAÇO DO CLIENTE</span><strong>{workspace.clientName}</strong><small>Portal exclusivo de aprovação</small></div>}
        </div>
        <nav className="side-nav">
          <span className="side-nav-label">NAVEGAÇÃO</span>
          <button className={view === "feed" ? "active" : ""} onClick={() => navigate("feed")}><Grid3X3 size={18} /> Conteúdos <span>{visibleFeed.length}</span></button>
          <button className={view === "stories" ? "active" : ""} onClick={() => navigate("stories")}><span className="story-nav-icon" /> Stories <span>{visibleStories.length}</span></button>
          <button className={view === "planejamento" ? "active" : ""} onClick={() => navigate("planejamento")}><FileText size={18} /> Planejamento</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-mark">?</span><div><strong>Precisa de ajuda?</strong><p>Fale com a equipe Nurea pelo WhatsApp.</p></div></div>
          {role === "equipe" && (
            <div style={{ display: "grid", gap: "6px", marginTop: "14px" }}>
              <button
                type="button"
                className="restore-button"
                onClick={async () => {
                  if (!window.confirm("Deseja sair do painel de administração?")) return;
                  await fetch("/api/admin/logout", { method: "POST" });
                  window.location.reload();
                }}
                style={{ color: "#e89980", cursor: "pointer" }}
              >
                <LogOut size={14} /> Sair do painel
              </button>
              <button type="button" className="restore-button" onClick={restoreDemo} style={{ cursor: "pointer" }}>
                <RotateCcw size={14} /> Restaurar demonstração
              </button>
            </div>
          )}
          <p>PORTAL DE CONTEÚDOS · NUREA</p>
        </div>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <div inert={!!selected} className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <div className="topbar-path"><span className="breadcrumb-context">Nurea <i>/</i> {workspace.clientName} <i>/</i></span><strong>{view === "feed" ? "Conteúdos" : view === "stories" ? "Stories" : "Planejamento"}</strong></div>
          <div className="topbar-actions">
            {role === "equipe" && (
              <button
                type="button"
                className="outline-button share-link-button"
                onClick={copyClientLink}
                title="Copiar link exclusivo deste cliente para enviar no WhatsApp"
              >
                <Link2 size={16} />
                <span>{copiedLink ? "✓ Link copiado!" : "Copiar link do cliente"}</span>
              </button>
            )}
            {!fixedRole ? (
              <label className="role-switch">
                <span>Visualizar como</span>
                <select value={role} onChange={(event) => { setRole(event.target.value as Role); setSelectedId(null); setLogoEditorOpen(false); }} aria-label="Visualizar como">
                  <option value="cliente">Cliente</option>
                  <option value="equipe">Equipe Nurea</option>
                </select>
              </label>
            ) : (
              <span className="demo-pill" style={{ background: "#edf4ed", borderColor: "#a0cca7", color: "#2d5738" }}>PORTAL DO CLIENTE</span>
            )}
          </div>
        </header>

        <main id="conteudo" className="content-area">
          {view === "feed" && <>
            <section className="client-cover" aria-label={`Espaço de ${workspace.clientName}`}>
              <div className="client-cover-brand">
                <button ref={logoButtonRef} type="button" className={`client-logo ${workspace.logoBorder ? "client-logo-bordered" : ""}`} onClick={openLogo} aria-label={role === "equipe" ? `${logoUrl ? "Ampliar e ajustar" : "Adicionar"} logo de ${workspace.clientName}` : `Ampliar logo de ${workspace.clientName}`} aria-haspopup="dialog">
                  {logoUrl ? <img src={logoUrl} alt="" style={{ transform: `translate(${workspace.logoOffsetX ?? 0}%, ${workspace.logoOffsetY ?? 0}%) scale(${(workspace.logoScale ?? 100) / 100})` }} /> : <span>{workspace.clientName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}
                </button>
                <div className="client-cover-identity"><span>ESPAÇO DE CONTEÚDO</span><strong>{workspace.clientName}</strong></div>
              </div>
              <div className="client-cover-month"><span>MÊS EM FOCO</span><div className="month-focus-row"><h1>{workspace.month}</h1><div className="month-focus-actions"><label className="sr-only" htmlFor="month-select">Selecionar mês em foco</label><select id="month-select" value={activeMonthKey} onChange={(event) => switchMonth(event.target.value)} aria-label="Selecionar mês em foco">{monthKeys.map((key) => <option key={key} value={key}>{monthName(key)}</option>)}</select>{role === "equipe" && <button type="button" onClick={() => { const [year, month] = activeMonthKey.split("-").map(Number); setNewMonthKey(new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7)); setNewMonthOpen(true); }}><Plus size={15} /> Novo mês</button>}</div></div></div>
              {role === "equipe" && <div className="client-cover-tools"><input ref={logoInputRef} className="sr-only" type="file" accept="image/*" onChange={uploadLogo} aria-label="Selecionar logo do cliente" /><button onClick={() => logoInputRef.current?.click()}><Plus size={15} /> {logoUrl ? "Trocar logo" : "Adicionar logo"}</button>{logoError && <span role="alert">{logoError}</span>}</div>}
            </section>
            <details className="feed-summary"><summary>Andamento do mês</summary><div className={`publication-cockpit ${role === "equipe" ? "cockpit-six" : "cockpit-five"}`} aria-label="Resumo da situação das publicações do feed">
              {summaryStatuses.map((status) => <div className={`cockpit-item cockpit-${status}`} key={status}>
                <span className="cockpit-count">{visibleFeed.filter((content) => content.status === status).length}</span>
                <span className="cockpit-label"><i aria-hidden="true" />{statusLabel[status]}</span>
              </div>)}
            </div>
            </details>
            <div className="feed-toolbar"><button className={`pending-filter ${pendingOnly ? "active" : ""}`} aria-pressed={pendingOnly} onClick={() => setPendingOnly(!pendingOnly)}>{pendingCount ? `${pendingCount} para aprovar` : "Nenhuma aprovação pendente"}{pendingOnly && " · Ver todos"}</button><div>{role === "equipe" && <button className="primary-button" onClick={() => { setNewFormat("arte"); setNewDate(`${activeMonthKey}-01`); setNewOpen(true); }}><Plus size={17} /> Novo conteúdo</button>}<button className="stories-shortcut" onClick={() => navigate("stories")}><span className="story-nav-icon" /> Stories <ArrowRight size={14} /></button></div></div>
            {role === "equipe" && <div className="team-note"><strong>Visão da equipe</strong><span>Itens em preparação são visíveis apenas aqui. Use “Visualizar como Cliente” para revisar a experiência do cliente.</span></div>}
            <div className="section-heading"><div><h2>Prévia do feed</h2><p>Abra um post, confira a legenda e os anexos e aprove ou peça um ajuste.</p></div><div className="view-switch" aria-label="Modo de visualização"><button className={feedMode === "grid" ? "active" : ""} onClick={() => setFeedMode("grid")} aria-label="Ver grade" title="Ver grade"><LayoutGrid size={18} /></button><button className={feedMode === "list" ? "active" : ""} onClick={() => setFeedMode("list")} aria-label="Ver lista" title="Ver lista"><List size={18} /></button></div></div>
            {feedMode === "grid" ? <div className="feed-grid">{displayedFeed.map((content) => <article key={content.id} className={`feed-card feed-state-${content.status}`}><div className="feed-card-meta"><strong className="feed-post-number">POST <span>{content.postNumber}</span></strong><span className="feed-post-date">{formatDate(content.date)}</span><span className="feed-card-format">{formatLabel[content.format]}</span></div><button className="feed-tile" onClick={(event) => openDetail(content.id, event.currentTarget)} aria-label={`Abrir POST ${content.postNumber}, ${formatLabel[content.format]}: ${content.title}, ${statusLabel[content.status]}`}><MediaPreview content={content} brand={workspace.clientName} mode="grid" /><span className={`tile-status tile-${content.status}`} title={statusLabel[content.status]} aria-hidden="true">{content.status === "aprovado" ? <CheckCircle2 size={14} /> : <i />}{shortStatus[content.status]}</span><span className="tile-overlay"><strong>{content.title}</strong><small>{statusLabel[content.status]} · {formatDate(content.date)}</small></span></button></article>)}</div> : <div className="content-list">{displayedFeed.map((content) => <button key={content.id} className="content-list-row" onClick={(event) => openDetail(content.id, event.currentTarget)}><span className="list-thumb"><MediaPreview content={content} brand={workspace.clientName} mode="list" /></span><span className="list-copy"><strong>POST {content.postNumber} · {content.title}</strong><small>{formatLabel[content.format]} · {formatDate(content.date)}</small></span><StatusBadge status={content.status} /><ArrowRight size={18} className="list-arrow" /></button>)}</div>}
            {displayedFeed.length === 0 && <div className="empty-state">{pendingOnly ? "Tudo revisado. Não há posts aguardando sua aprovação." : "Nenhum conteúdo disponível neste mês."}{pendingOnly && <button className="text-button" onClick={() => setPendingOnly(false)}>Ver feed completo</button>}</div>}
            <div className="feed-footer"><span><span className="footer-line" /> CONSTRUINDO UMA PRESENÇA COM PROPÓSITO</span><button onClick={() => navigate("stories")}>Ver Stories <ArrowRight size={17} /></button></div>
          </>}

          {view === "stories" && <>
            <div className="eyebrow">CONTEÚDOS DO MÊS <span>·</span> {workspace.month.toUpperCase()}</div>
            <div className="page-heading"><div><h1>Stories <em>originais.</em></h1><p>Peças criadas especialmente para os Stories. Compartilhamentos de posts do feed não aparecem aqui como novo conteúdo.</p></div>{role === "equipe" && <button className="primary-button" onClick={() => { setNewFormat("story"); setNewDate(`${activeMonthKey}-01`); setNewOpen(true); }}><Plus size={17} /> Novo Story</button>}</div>
            <div className="story-explainer"><span className="story-explainer-icon">↗</span><p>Um post do feed compartilhado no Story continua ligado à publicação original — sem nova aprovação.</p></div>
            <div className="section-heading"><div><span className="section-kicker">ÁREA SEPARADA DO FEED</span><h2>Peças para Stories</h2></div></div>
            <div className="stories-grid">{visibleStories.map((content) => <button key={content.id} className="story-card" onClick={(event) => openDetail(content.id, event.currentTarget)}><div className="story-visual"><MediaPreview content={content} brand={workspace.clientName} mode="story" /></div><div className="story-card-copy"><span>{formatDate(content.date)}</span><strong>{content.title}</strong><StatusBadge status={content.status} /></div></button>)}</div>
            {visibleStories.length === 0 && <div className="empty-state">Nenhum Story original disponível.</div>}
          </>}

          {view === "planejamento" && <>
            <div className="eyebrow">DIREÇÃO DO MÊS <span>·</span> {workspace.month.toUpperCase()}</div>
            <div className="page-heading"><div><h1>Planejamento <em>editorial.</em></h1><p>O documento que orienta o mês, sempre à mão para consulta.</p></div></div>
            <div className="plan-toolbar"><div><FileText size={20} /><div><strong>Planejamento editorial · {workspace.month}</strong><small>{`${workspace.plan.file?.name ?? (activeMonthKey === "2026-09" && !workspace.plan.exampleRemoved ? "Exemplo ilustrativo" : "Sem arquivo")} · versão ${workspace.plan.version}`}</small></div></div><StatusBadge status={workspace.plan.status} /></div>
            <div className="plan-layout"><PlanDocument key={`${clientId}-${activeMonthKey}`} plan={workspace.plan} monthKey={activeMonthKey} team={role === "equipe"} onChange={update => setWorkspace(prev => (prev.monthKey ?? "2026-09") === activeMonthKey ? { ...prev, plan: update(prev.plan) } : prev)} /><aside className="plan-side"><div className="plan-side-card"><span className="section-kicker">STATUS DO DOCUMENTO</span><h3>{planStatusLabel[workspace.plan.status]}</h3><p>{workspace.plan.status === "rascunho" ? "A equipe ainda não enviou o planejamento deste mês." : "Confira o documento antes de aprovar. A aprovação do planejamento não aprova os posts individualmente."}</p>{role === "cliente" && workspace.plan.status === "aguardando" && <div className="plan-actions"><button className="primary-button" onClick={() => updatePlan("aprovado", "Planejamento aprovado")}><Check size={17} /> Aprovar planejamento</button><button className="outline-button" onClick={() => setPlanAdjustOpen(true)}><MessageCircle size={17} /> Pedir ajuste</button></div>}{role === "equipe" && (workspace.plan.status === "ajuste" || workspace.plan.status === "rascunho") && !!(workspace.plan.file || (activeMonthKey === "2026-09" && !workspace.plan.exampleRemoved)) && <button className="primary-button" onClick={() => updatePlan("aguardando", "Planejamento reenviado para aprovação")}>Enviar para aprovação</button>}{role === "equipe" && workspace.plan.status === "aprovado" && <p className="plan-side-hint"><CheckCircle2 size={16} /> Planejamento aprovado. Uma nova versão deverá ter aprovação própria.</p>}</div><div className="plan-side-card"><span className="section-kicker">HISTÓRICO</span>{workspace.plan.activity.length ? workspace.plan.activity.map((activity) => <div className="activity-item" key={activity.id}><span className="activity-mark" /><div><strong>{activity.action}</strong><small>{activity.author} · {formatActivityDate(activity.at)} · v{activity.version}</small>{activity.note && <p>{activity.note}</p>}</div></div>) : <p>Nenhuma ação registrada.</p>}</div></aside></div>
          </>}
        </main>
      </div>

      {selected && <ContentDetail key={`${clientId}-${selected.id}`} content={selected} clientName={workspace.clientName} role={role} position={selectedPosition} total={currentList.length} onClose={closeDetail} onDelete={() => { if (!window.confirm(`Excluir ${selected.postNumber ? `POST ${selected.postNumber}` : "Story"}? Esta ação remove a peça e seu histórico deste mês.`)) return; setWorkspace(prev => ({ ...prev, nextPostNumber: Math.max(prev.nextPostNumber ?? 1, ...prev.contents.map(item => (item.postNumber ?? 0) + 1)), contents: prev.contents.filter(item => item.id !== selected.id) })); closeDetail(); }} onNavigate={(direction) => { const next = currentList[selectedPosition + direction]; if (next) openDetail(next.id); }} onUpdate={(transform) => updateContent(selected.id, transform)} onAction={(status, action, note) => actionOnContent(selected.id, status, action, note)} />}

      {logoEditorOpen && <div className="logo-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeLogo(); }}>
        <section className="logo-modal" role="dialog" aria-modal="true" aria-labelledby="logo-modal-title">
          <button ref={logoModalCloseRef} type="button" className="icon-button logo-modal-close" onClick={closeLogo} aria-label="Fechar visualização da logo"><X size={20} /></button>
          <span className="section-kicker">{role === "equipe" ? "IDENTIDADE DO CLIENTE" : "ESPAÇO DE CONTEÚDO"}</span>
          <h2 id="logo-modal-title">{role === "equipe" ? "Ajustar logo" : workspace.clientName}</h2>
          {role === "equipe" && <p className="logo-modal-hint">Arraste para posicionar e use o controle para aproximar ou afastar.</p>}
          <div className={`logo-modal-preview ${logoDraft.border ? "logo-modal-preview-bordered" : ""} ${role === "equipe" ? "logo-modal-preview-draggable" : ""}`}
            onPointerDown={(event) => {
              if (role !== "equipe" || !logoUrl) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              logoDragRef.current = { x: event.clientX, y: event.clientY, offsetX: logoDraft.x, offsetY: logoDraft.y };
            }}
            onPointerMove={(event) => {
              const start = logoDragRef.current;
              if (!start || role !== "equipe") return;
              const size = event.currentTarget.getBoundingClientRect().width;
              setLogoDraft((draft) => ({ ...draft, x: Math.max(-100, Math.min(100, start.offsetX + (event.clientX - start.x) / size * 100)), y: Math.max(-100, Math.min(100, start.offsetY + (event.clientY - start.y) / size * 100)) }));
            }}
            onPointerUp={() => { logoDragRef.current = null; }}
            onPointerCancel={() => { logoDragRef.current = null; }}>
            {logoUrl ? <img src={logoUrl} alt={`Logo de ${workspace.clientName}`} draggable={false} style={{ transform: `translate(${logoDraft.x}%, ${logoDraft.y}%) scale(${logoDraft.scale / 100})` }} /> : <span>{workspace.clientName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}
          </div>
          {role === "equipe" && <div className="logo-modal-controls">
            <label htmlFor="logo-scale">Zoom <strong>{logoDraft.scale}%</strong></label>
            <input id="logo-scale" type="range" min="50" max="220" step="5" value={logoDraft.scale} onChange={(event) => setLogoDraft((draft) => ({ ...draft, scale: Number(event.target.value) }))} />
            <label className="logo-border-choice"><input type="checkbox" checked={logoDraft.border} onChange={(event) => setLogoDraft((draft) => ({ ...draft, border: event.target.checked }))} /> Mostrar aro dourado</label>
            <button type="button" className="text-button danger-button" onClick={() => { if (window.confirm("Remover a logo deste cliente?")) { setWorkspace(prev => ({ ...prev, logoFileId: undefined })); closeLogo(); } }}>Remover logo</button><button type="button" className="text-button" onClick={() => setLogoDraft({ scale: 100, x: 0, y: 0, border: false })}>Restaurar enquadramento</button>
            <div className="logo-modal-actions"><button type="button" className="outline-button" onClick={closeLogo}>Cancelar</button><button type="button" className="primary-button" onClick={() => { setWorkspace((prev) => ({ ...prev, logoScale: logoDraft.scale, logoOffsetX: logoDraft.x, logoOffsetY: logoDraft.y, logoBorder: logoDraft.border })); closeLogo(); }}>Aplicar enquadramento</button></div>
          </div>}
        </section>
      </div>}

      {newMonthOpen && role === "equipe" && <div className="small-modal-backdrop"><form className="small-modal" onSubmit={(event) => { event.preventDefault(); switchMonth(newMonthKey, true); }}>
        <button type="button" className="icon-button small-modal-close" onClick={() => setNewMonthOpen(false)} aria-label="Fechar"><X size={19} /></button>
        <span className="section-kicker">ESPAÇO DE {workspace.clientName.toUpperCase()}</span><h2>Novo mês</h2>
        <p>Crie um espaço independente para os conteúdos e o planejamento do período. Os meses anteriores continuam disponíveis.</p>
        <label htmlFor="new-month">Mês e ano</label><input id="new-month" type="month" value={newMonthKey} onChange={(event) => setNewMonthKey(event.target.value)} required />
        <button type="submit" className="primary-button"><Plus size={16} /> {monthKeys.includes(newMonthKey) ? "Abrir mês existente" : "Criar mês"}</button>
      </form></div>}

      {planAdjustOpen && <div className="small-modal-backdrop"><form className="small-modal" onSubmit={(event) => { event.preventDefault(); if (!planAdjustText.trim()) return; updatePlan("ajuste", "Ajuste solicitado no planejamento", planAdjustText.trim()); setPlanAdjustOpen(false); setPlanAdjustText(""); }}><button type="button" className="icon-button small-modal-close" onClick={() => setPlanAdjustOpen(false)} aria-label="Fechar"><X size={19} /></button><span className="section-kicker">PLANEJAMENTO</span><h2>Pedir ajuste</h2><p>Seu comentário ficará vinculado a esta versão do planejamento.</p><label htmlFor="plan-adjust">O que deve mudar?</label><textarea id="plan-adjust" value={planAdjustText} onChange={(event) => setPlanAdjustText(event.target.value)} required rows={5} /><button className="primary-button" type="submit">Enviar pedido</button></form></div>}

      {newOpen && <div className="small-modal-backdrop"><form className="small-modal" onSubmit={createContent}>
        <button type="button" className="icon-button small-modal-close" onClick={() => { setNewOpen(false); setNewMediaFiles([]); setNewMediaError(""); }} aria-label="Fechar"><X size={19} /></button>
        <span className="section-kicker">ÁREA DA EQUIPE</span><h2>Novo conteúdo</h2>
        <p>Adicione a peça final para vê-la na prévia do feed. O conteúdo começa em preparação.</p>
        <label htmlFor="new-title">Título</label><input id="new-title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required placeholder="Tema da publicação" />
        <label htmlFor="new-format">Formato</label><select id="new-format" value={newFormat} onChange={(event) => { setNewFormat(event.target.value as ContentFormat); setNewMediaFiles([]); setNewMediaError(""); }}><option value="arte">Arte</option><option value="carrossel">Carrossel</option><option value="reels">Reels / vídeo</option><option value="story">Story original</option></select>
        <label htmlFor="new-date">Data prevista</label><input id="new-date" type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} required />
        <label htmlFor="new-caption">Legenda</label><textarea id="new-caption" value={newCaption} onChange={(event) => setNewCaption(event.target.value)} rows={3} />
        <label htmlFor="new-media">Arquivo da publicação</label><input id="new-media" className="media-file-input" type="file" accept={mediaAccept(newFormat)} multiple={newFormat === "carrossel"} onChange={(event) => { setNewMediaFiles(Array.from(event.target.files ?? [])); setNewMediaError(""); }} />
        <p className="media-hint">{newFormat === "carrossel" ? "Selecione até 10 imagens na ordem desejada." : newFormat === "reels" ? "Selecione um vídeo (até 100 MB)." : newFormat === "story" ? "Selecione uma imagem ou um vídeo." : "Selecione uma imagem (até 20 MB)."} O arquivo fica apenas neste navegador.</p>
        {newMediaFiles.length > 0 && <div className="selected-media"><strong>{newMediaFiles.length} {newMediaFiles.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}</strong>{newMediaFiles.map((file, index) => <span key={index}>{index + 1}. {file.name}</span>)}</div>}
        {newMediaError && <p className="file-error" role="alert">{newMediaError}</p>}
        <button type="submit" className="primary-button" disabled={newSaving}><Plus size={16} /> {newSaving ? "Salvando..." : "Criar conteúdo"}</button>
      </form></div>}
    </div>
  );
}
