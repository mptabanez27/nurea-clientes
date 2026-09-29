"use client";

import { useEffect, useRef, useState } from "react";
import MediaPreview from "./MediaPreview";
import ContentDetail from "./ContentDetail";
import PlanDocument from "./PlanDocument";
import { deleteLocalFile, getLocalFile, saveLocalFile } from "@/lib/localFiles";
import { mediaAccept, validateMediaFiles } from "@/lib/media";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronsUpDown,
  FileText,
  Film,
  Grid,
  Grid3X3,
  GripVertical,
  Home,
  Instagram,
  Layers,
  LayoutGrid,
  Link2,
  List,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  PlusSquare,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getInstagramHandle(name: string) {
  if (name.toLowerCase().includes("rose brighenti")) return "@studiorosebrighenti";
  return "@" + name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
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
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>(process.env.NODE_ENV === "production" ? {} : initialWorkspaces);
  const [clientId, setClientId] = useState(initialClientId ?? availableClients?.[0]?.id ?? defaultClientId);
  const [cloudLoadedWorkspace, setCloudLoadedWorkspace] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [instaFeedOpen, setInstaFeedOpen] = useState(false);
  const [instaScope, setInstaScope] = useState<"mes" | "todos">("mes");
  const [allFeed, setAllFeed] = useState<{ monthKey: string; content: Content }[]>([]);
  const [allFeedLoading, setAllFeedLoading] = useState(false);
  const [allFeedError, setAllFeedError] = useState("");
  const [pendingDetail, setPendingDetail] = useState<{ id: string; monthKey: string } | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoButtonRef = useRef<HTMLButtonElement>(null);
  const logoModalCloseRef = useRef<HTMLButtonElement>(null);
  const logoDragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (clientToken) headers.set("x-nurea-client-token", clientToken);
    return fetch(input, { ...init, headers });
  }

  async function checkedApi(input: RequestInfo | URL, init?: RequestInit) {
    const response = await apiFetch(input, init);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Não foi possível salvar. Tente novamente.");
    }
    return response;
  }
  const workspace = workspaces[clientId] ?? initialWorkspaces[defaultClientId];
  const logoUrl = logoPreview && logoPreview.id === workspace.logoFileId ? logoPreview.url : null;
  const activeMonthKey = workspace.monthKey ?? "2026-09";
  const monthKeys = Array.from(
    new Set([
      ...Object.keys(workspace.months ?? {}),
      activeMonthKey,
    ])
  )
    .filter((k) => /^\d{4}-(0[1-9]|1[0-2])$/.test(k))
    .sort()
    .reverse();

  function reorderFeed(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const before = workspace.contents;
    const feedItems = before.filter((content) => content.format !== "story");
    const storyItems = before.filter((content) => content.format === "story");
    const sourceIndex = feedItems.findIndex((content) => content.id === sourceId);
    const targetIndex = feedItems.findIndex((content) => content.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...feedItems];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const updatedFeed = reordered.slice(0, 8).map((item, index) => ({ ...item, postNumber: index + 1 }));
    setWorkspace((current) => ({ ...current, contents: [...updatedFeed, ...storyItems] }));
    checkedApi("/api/contents/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updatedFeed.map((item) => ({ id: item.id, postNumber: item.postNumber })) }),
    }).catch((error) => {
      setWorkspace((current) => ({ ...current, contents: before }));
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível reordenar os posts.");
    });
  }

  function monthName(key: string) {
    const [year, month] = key.split("-").map(Number);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function copyClientLink() {
    const current = clientsList.find((c) => c.id === clientId);
    const demoClient = demoClients.find((c) => c.id === clientId);
    const token = clientToken || (current as any)?.access_token || (process.env.NODE_ENV === "production" ? undefined : demoClient?.accessToken);
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
      const res = await apiFetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const created = await res.json();
      if (res.ok && created?.id) {
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

  async function switchMonth(nextKey: string, create = false) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nextKey)) return;
    if (!create && !monthKeys.includes(nextKey)) return;
    if (nextKey === activeMonthKey) { setNewMonthOpen(false); return; }

    if (create) {
      try {
        await checkedApi("/api/workspace/month", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, monthKey: nextKey }),
        });
      } catch (error) {
        setSyncFeedback(error instanceof Error ? error.message : "Não foi possível criar o mês.");
        return;
      }
    }

    setWorkspace((prev) => {
      const currentKey = prev.monthKey ?? "2026-09";
      const months = {
        ...prev.months,
        [currentKey]: { plan: prev.plan, contents: prev.contents, nextPostNumber: prev.nextPostNumber },
        [nextKey]: prev.months?.[nextKey] ?? {
          plan: { status: "rascunho" as const, version: 1, activity: [] },
          contents: [],
          nextPostNumber: 1,
        },
      };
      const target: import("@/lib/demo").MonthCycle = months[nextKey] ?? {
        plan: { status: "rascunho" as const, version: 1, activity: [] },
        contents: [],
        nextPostNumber: 1,
      };
      return {
        ...prev,
        monthKey: nextKey,
        month: monthName(nextKey),
        months,
        plan: target.plan,
        contents: target.contents,
        nextPostNumber: target.nextPostNumber ?? 1,
      };
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
        if (!availableClients && !fixedClient) {
          const resClients = await apiFetch("/api/clients");
          if (resClients.ok) {
            const all = await resClients.json();
            if (active && all && all.length > 0) {
              setClientsList(all.map((c: any) => ({ id: c.id, name: c.name, access_token: c.access_token })));
            }
          }
        }
        const resWs = await apiFetch(`/api/workspace?clientId=${clientId}&monthKey=${activeMonthKey}`);
        if (resWs.ok) {
          const cloudData = await resWs.json();
          if (active && cloudData) {
            setCloudLoadedWorkspace(`${clientId}:${activeMonthKey}`);
            setWorkspaceError(null);
            setWorkspaces((prev) => {
              const prevWs = prev[clientId];
              const mergedMonths = {
                ...(prevWs?.months ?? {}),
                ...(cloudData.months ?? {}),
              };
              return {
                ...prev,
                [clientId]: {
                  ...cloudData,
                  months: mergedMonths,
                },
              };
            });
          }
        } else if (active) {
          setWorkspaceError("Não foi possível carregar os dados deste cliente. Atualize a página para tentar novamente.");
        }
      } catch (err) {
        console.warn("Sync com backend falhou:", err);
        if (active) setWorkspaceError("Conexão indisponível. Atualize a página para tentar novamente.");
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
        const parsed = JSON.parse(saved) as { clientId?: string; role?: Role };
        if (!initialClientId && parsed?.clientId && (clientsList.some(c => c.id === parsed.clientId) || (process.env.NODE_ENV !== "production" && demoClients.some((client) => client.id === parsed.clientId)))) {
          setClientId(parsed.clientId);
        }
        if (!initialRole && (parsed?.role === "equipe" || parsed?.role === "cliente")) {
          setRole(parsed.role);
        }
      }
    } catch {
      // Corrupt or unavailable local state is safely ignored.
    }
    setHydrated(true);
  }, [fixedRole, initialClientId, initialRole, clientsList]);

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
      const { uploadFileToStorage } = await import("@/lib/cloudStorage");
      const logoUrl = await uploadFileToStorage(file, `logos/${clientId}-${Date.now()}-${file.name}`);

      await checkedApi("/api/clients/logo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, logo_url: logoUrl, logo_scale: 100, logo_offset_x: 0, logo_offset_y: 0, logo_border: false }),
      });
      setWorkspace((prev) => ({ ...prev, logoFileId: logoUrl, logoScale: 100, logoOffsetX: 0, logoOffsetY: 0, logoBorder: false }));
      setLogoDraft({ scale: 100, x: 0, y: 0, border: false });
      setLogoEditorOpen(true);
    } catch (err) {
      console.error("Erro ao fazer upload da logo:", err);
      setLogoError("Não foi possível salvar a logo.");
    }
  }

  const feedContents = workspace.contents.filter((content) => content.format !== "story");
  const storyContents = workspace.contents.filter((content) => content.format === "story");
  const visibleFeed = ensurePostNumbers(feedContents)
    .filter((content) => role === "equipe" || content.status !== "producao")
    .sort((a, b) => (a.postNumber ?? 0) - (b.postNumber ?? 0));
  const visibleStories = storyContents.filter((content) => role === "equipe" || content.status !== "producao");
  const displayedFeed = pendingOnly ? visibleFeed.filter(content => content.status === "aguardando") : visibleFeed;
  const simulatedFeed = instaScope === "mes"
    ? visibleFeed.map((content) => ({ monthKey: activeMonthKey, content }))
    : allFeed;

  async function showAllFeed() {
    setInstaScope("todos");
    setAllFeedLoading(true);
    setAllFeedError("");
    try {
      const entries = await Promise.all(monthKeys.map(async (monthKey) => {
        if (monthKey === activeMonthKey) return { monthKey, contents: workspace.contents };
        const response = await checkedApi(`/api/workspace?clientId=${encodeURIComponent(clientId)}&monthKey=${monthKey}`);
        const data = await response.json() as Workspace;
        return { monthKey, contents: data.contents };
      }));
      setAllFeed(entries.flatMap(({ monthKey, contents }) => contents
        .filter((content) => content.format !== "story" && content.status !== "producao")
        .map((content) => ({ monthKey, content })))
        .sort((a, b) => b.content.date.localeCompare(a.content.date) || b.monthKey.localeCompare(a.monthKey) || (b.content.postNumber ?? 0) - (a.content.postNumber ?? 0)));
    } catch (error) {
      setAllFeedError(error instanceof Error ? error.message : "Não foi possível carregar todos os meses.");
    } finally {
      setAllFeedLoading(false);
    }
  }

  function openSimulatedContent(id: string, monthKey: string) {
    setInstaFeedOpen(false);
    if (monthKey === activeMonthKey) {
      openDetail(id);
    } else {
      setPendingDetail({ id, monthKey });
      void switchMonth(monthKey);
    }
  }

  useEffect(() => {
    if (pendingDetail && activeMonthKey === pendingDetail.monthKey && workspace.contents.some((item) => item.id === pendingDetail.id)) {
      setSelectedId(pendingDetail.id);
      setPendingDetail(null);
    }
  }, [pendingDetail, activeMonthKey, workspace.contents]);
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
    const before = workspace.contents.find((content) => content.id === id);
    if (!before) return;
    const transformed = transform(before);
    const nextNumber = Math.max(workspace.nextPostNumber ?? 1, workspace.contents.reduce((max, item) => Math.max(max, item.postNumber ?? 0), 0) + 1);
    const updated = transformed.format === "story" || transformed.postNumber ? transformed : { ...transformed, postNumber: nextNumber };
    setWorkspace((current) => ({ ...current, contents: current.contents.map((content) => content.id === id ? updated : content) }));
    checkedApi("/api/contents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, monthKey: activeMonthKey, content: updated }),
    }).catch((error) => {
      setWorkspace((current) => ({ ...current, contents: current.contents.map((content) => content.id === id ? before : content) }));
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível salvar o post.");
    });
  }

  async function actionOnContent(id: string, status: ContentStatus, action: string, note?: string, author?: string): Promise<boolean> {
    const effectiveAuthor = author || (role === "cliente" ? "Cliente" : "Equipe Nurea");
    const tempId = uid();
    const before = workspace.contents.find((content) => content.id === id);
    if (!before) return false;
    setWorkspace((current) => ({ ...current, contents: current.contents.map((content) => content.id === id
      ? { ...content, status, activity: [{ id: tempId, author: effectiveAuthor, action, note, at: todayStamp(), version: content.version }, ...content.activity] }
      : content) }));
    try {
      const response = await checkedApi("/api/contents/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: id, clientId, monthKey: activeMonthKey, status, action, note, author: effectiveAuthor, version: selected?.version || 1 }),
      });
      const data = await response.json();
      if (data.activityId) setWorkspace((current) => ({ ...current, contents: current.contents.map((content) => content.id === id
        ? { ...content, activity: content.activity.map((item) => item.id === tempId ? { ...item, id: data.activityId } : item) }
        : content) }));
      return true;
    } catch (error) {
      setWorkspace((current) => ({ ...current, contents: current.contents.map((content) => content.id === id ? before : content) }));
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível salvar esta ação.");
      return false;
    }
  }

  async function createContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !newDate || newSaving) return;
    if (workspace.plan.status !== "aprovado") {
      setNewMediaError("Aprove o planejamento deste mês antes de iniciar a produção dos posts.");
      return;
    }
    if (newFormat !== "story" && feedContents.length >= 8) {
      setNewMediaError("Limite de 8 posts no feed atingido para este mês. Exclua um post para adicionar outro, ou crie um Story.");
      return;
    }
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
        } catch (error) {
          if (process.env.NODE_ENV === "production") throw error;
        }
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

    // Encontra o primeiro número livre entre 1 e 8
    let nextPostNum: number | undefined;
    if (newFormat !== "story") {
      const existingNums = new Set(feedContents.map((c) => c.postNumber).filter(Boolean));
      for (let i = 1; i <= 8; i++) {
        if (!existingNums.has(i)) {
          nextPostNum = i;
          break;
        }
      }
      if (!nextPostNum) nextPostNum = Math.min(8, feedContents.length + 1);
    }

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
    try {
      await checkedApi("/api/contents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, monthKey: activeMonthKey, content }),
      });
    } catch (error) {
      setNewMediaError(error instanceof Error ? error.message : "Não foi possível criar o conteúdo.");
      setNewSaving(false);
      return;
    }
    setWorkspace((prev) => {
      const nextContents = [...prev.contents, content];
      const feed = nextContents
        .filter((c) => c.format !== "story")
        .sort((a, b) => (a.postNumber ?? 0) - (b.postNumber ?? 0))
        .slice(0, 8);
      const stories = nextContents.filter((c) => c.format === "story");
      return { ...prev, contents: [...feed, ...stories] };
    });
    setNewOpen(false);
    setNewTitle("");
    setNewCaption("");
    setNewMediaFiles([]);
    setNewSaving(false);
    setView(newFormat === "story" ? "stories" : "feed");
    requestAnimationFrame(() => openDetail(content.id));

  }

  function updatePlan(status: Workspace["plan"]["status"], action: string, note?: string) {
    if (role === "equipe" && status === "aguardando" && !workspace.plan.file) {
      setSyncFeedback("Adicione o planejamento do cliente antes de enviá-lo.");
      return;
    }
    const before = workspace.plan;
    setWorkspace((prev) => {
      const nextVersion = prev.plan.version;
      const activity: import("@/lib/demo").Activity = { id: uid(), author: role === "cliente" ? "Cliente" : "Equipe Nurea", action, note, at: todayStamp(), version: nextVersion };
      return { ...prev, plan: { ...prev.plan, status, version: nextVersion, activity: [activity, ...prev.plan.activity] } };
    });
    setPlanAdjustOpen(false);
    setPlanAdjustText("");
    checkedApi("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        monthKey: activeMonthKey,
        status,
        action,
        author: role === "cliente" ? "Cliente" : "Equipe Nurea",
        note,
      }),
    }).catch((error) => {
      setWorkspace((current) => ({ ...current, plan: before }));
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível salvar o planejamento.");
    });
  }

  function changePlanFile(update: (plan: Workspace["plan"]) => Workspace["plan"]) {
    const before = workspace.plan;
    const nextPlan = update(before);
    setWorkspace((current) => ({ ...current, plan: nextPlan }));
    checkedApi("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId, monthKey: activeMonthKey, status: nextPlan.status,
        action: nextPlan.activity[0]?.action || "Planejamento atualizado",
        author: "Equipe Nurea", fileUrl: nextPlan.file?.url ?? null,
        fileName: nextPlan.file?.name ?? null,
        exampleRemoved: nextPlan.exampleRemoved ?? false,
      }),
    }).catch((error) => {
      setWorkspace((current) => ({ ...current, plan: before }));
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível salvar o arquivo do planejamento.");
    });
  }

  async function removeLogo() {
    if (!window.confirm("Remover a logo deste cliente?")) return;
    try {
      await checkedApi("/api/clients/logo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, logo_url: null }),
      });
      setWorkspace((current) => ({ ...current, logoFileId: undefined }));
      closeLogo();
    } catch (error) {
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível remover a logo.");
    }
  }

  async function applyLogoFrame() {
    const roundedScale = Math.round(logoDraft.scale);
    const roundedX = Math.round(logoDraft.x);
    const roundedY = Math.round(logoDraft.y);
    try {
      await checkedApi("/api/clients/logo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, logo_scale: roundedScale, logo_offset_x: roundedX, logo_offset_y: roundedY, logo_border: logoDraft.border }),
      });
      setWorkspace((current) => ({ ...current, logoScale: roundedScale, logoOffsetX: roundedX, logoOffsetY: roundedY, logoBorder: logoDraft.border }));
      closeLogo();
    } catch (error) {
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível aplicar o enquadramento.");
    }
  }

  async function deleteSelectedContent() {
    if (!selected) return;
    if (!window.confirm(`Excluir ${selected.postNumber ? `POST ${selected.postNumber}` : "Story"}? Esta ação remove a peça e seu histórico deste mês.`)) return;
    try {
      await checkedApi(`/api/contents?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });
      const remaining = workspace.contents.filter((item) => item.id !== selected.id);
      const feed = remaining.filter((item) => item.format !== "story");
      const stories = remaining.filter((item) => item.format === "story");
      const updatedFeed = feed.slice(0, 8).map((item, index) => ({ ...item, postNumber: index + 1 }));
      setWorkspace((current) => ({ ...current, contents: [...updatedFeed, ...stories] }));
      closeDetail();
      if (selected.format !== "story") {
        await checkedApi("/api/contents/reorder", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updatedFeed.map((item) => ({ id: item.id, postNumber: item.postNumber })) }),
        });
      }
    } catch (error) {
      await syncFromCloud();
      setSyncFeedback(error instanceof Error ? error.message : "Não foi possível excluir o post.");
    }
  }

  async function syncFromCloud() {
    setSyncingCloud(true);
    setSyncFeedback(null);
    try {
      if (!availableClients && !fixedClient) {
        const resClients = await apiFetch("/api/clients");
        if (resClients.ok) {
          const all = await resClients.json();
          if (all && all.length > 0) {
            setClientsList(all.map((c: any) => ({ id: c.id, name: c.name, access_token: c.access_token })));
          }
        }
      }
      const resWs = await checkedApi(`/api/workspace?clientId=${clientId}&monthKey=${activeMonthKey}`);
      const cloudData = await resWs.json();
      if (cloudData) setWorkspaces((prev) => ({ ...prev, [clientId]: cloudData }));
      setSyncFeedback("✓ Sincronizado com a nuvem!");
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err) {
      console.warn("Erro ao sincronizar da nuvem:", err);
      setSyncFeedback("Erro ao sincronizar.");
      setTimeout(() => setSyncFeedback(null), 3500);
    } finally {
      setSyncingCloud(false);
    }
  }

  function handleConfirmRestoreDemo() {
    if (restoreConfirmText.trim().toUpperCase() !== "RESTAURAR") return;
    setWorkspaces(initialWorkspaces);
    setClientId(defaultClientId);
    setSelectedId(null);
    setClientMenuOpen(false);
    setLogoEditorOpen(false);
    setNewMonthOpen(false);
    setView("feed");
    setPendingOnly(false);
    setRestoreModalOpen(false);
    setRestoreConfirmText("");
    setSyncFeedback("Exemplos restaurados. Clique em 'Sincronizar nuvem' para recarregar do banco.");
    setTimeout(() => setSyncFeedback(null), 5000);
  }

  if (process.env.NODE_ENV === "production" && cloudLoadedWorkspace !== `${clientId}:${activeMonthKey}`) {
    return <main className="portal-loading" role="status">
      <img src="/brand/logopng1.svg" alt="Nurea" width="150" height="44" />
      <h1>{workspaceError ? "Não foi possível abrir este espaço" : "Preparando seu espaço"}</h1>
      <p>{workspaceError || "Carregando os conteúdos e o planejamento…"}</p>
      {workspaceError && <button className="primary-button" onClick={() => window.location.reload()}>Tentar novamente</button>}
    </main>;
  }

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      {syncFeedback && <div className="portal-feedback" role="alert">{syncFeedback}<button type="button" onClick={() => setSyncFeedback(null)} aria-label="Dispensar aviso"><X size={14} /></button></div>}
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
                  await apiFetch("/api/admin/logout", { method: "POST" });
                  window.location.reload();
                }}
                style={{ color: "#e89980", cursor: "pointer" }}
              >
                <LogOut size={14} /> Sair do painel
              </button>
              <button
                type="button"
                className="restore-button"
                onClick={syncFromCloud}
                disabled={syncingCloud}
                style={{ color: "#c2d0c7", cursor: "pointer" }}
                title="Recarregar dados atualizados do banco de dados na nuvem"
              >
                <RefreshCw size={13} className={syncingCloud ? "spinning" : ""} />{" "}
                {syncingCloud ? "Sincronizando..." : "Sincronizar nuvem"}
              </button>
              {process.env.NODE_ENV !== "production" && <button
                type="button"
                className="restore-button"
                onClick={() => {
                  setRestoreConfirmText("");
                  setRestoreModalOpen(true);
                }}
                style={{ color: "#81998b", cursor: "pointer", fontSize: "10px", marginTop: "4px" }}
                title="Abre confirmação para restaurar exemplos locais"
              >
                <RotateCcw size={12} /> Restaurar demonstração local
              </button>}
              {syncFeedback && (
                <div style={{ fontSize: "10px", color: "#a5d6a7", padding: "4px 8px", background: "#ffffff0f", borderRadius: "6px", marginTop: "4px", lineHeight: 1.4 }}>
                  {syncFeedback}
                </div>
              )}
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
            <div className="feed-toolbar"><button className={`pending-filter ${pendingOnly ? "active" : ""}`} aria-pressed={pendingOnly} onClick={() => setPendingOnly(!pendingOnly)}>{pendingCount ? `${pendingCount} para aprovar` : "Nenhuma aprovação pendente"}{pendingOnly && " · Ver todos"}</button><div>{role === "equipe" && <button className="primary-button" disabled={feedContents.length >= 8 || workspace.plan.status !== "aprovado"} title={workspace.plan.status !== "aprovado" ? "Aprove o planejamento antes de produzir conteúdos" : feedContents.length >= 8 ? "Limite máximo de 8 posts atingido para este mês" : undefined} onClick={() => { if (feedContents.length >= 8) { alert("Este cliente já atingiu o limite de 8 posts no feed para este mês. Exclua um post para adicionar outro, ou crie um Story."); return; } setNewFormat("arte"); setNewDate(`${activeMonthKey}-01`); setNewOpen(true); }}><Plus size={17} /> {feedContents.length >= 8 ? "Feed completo (8/8)" : "Novo conteúdo"}</button>}<button className="stories-shortcut" onClick={() => navigate("stories")}><span className="story-nav-icon" /> Stories <ArrowRight size={14} /></button></div></div>
            {role === "equipe" && <div className="team-note"><strong>Visão da equipe</strong><span>Itens em preparação são visíveis apenas aqui. Arraste qualquer card para mudar sua posição e reordenar automaticamente a numeração do feed (máx. 8 posts).</span></div>}
            <div className="section-heading">
              <div>
                <h2>Prévia do feed</h2>
                <p>Abra um post, confira a legenda e os anexos e aprove ou peça um ajuste.</p>
              </div>
              <div className="view-switch" aria-label="Modo de visualização">
                <button
                  className={feedMode === "grid" ? "active" : ""}
                  onClick={() => setFeedMode("grid")}
                  aria-label="Ver grade"
                  title="Ver grade"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={feedMode === "list" ? "active" : ""}
                  onClick={() => setFeedMode("list")}
                  aria-label="Ver lista"
                  title="Ver lista"
                >
                  <List size={18} />
                </button>
                <button
                  type="button"
                  className={`insta-switch-btn ${instaFeedOpen ? "active" : ""}`}
                  onClick={() => setInstaFeedOpen(true)}
                  aria-label="Simulação Instagram Mobile"
                  title="Simulação Instagram Mobile"
                >
                  <Instagram size={18} />
                </button>
              </div>
            </div>
            {feedMode === "grid" ? <div className="feed-grid">{displayedFeed.map((content) => <article key={content.id} className={`feed-card feed-state-${content.status} ${role === "equipe" ? "feed-card-draggable" : ""} ${draggedId === content.id ? "feed-card-dragging" : ""} ${dragOverId === content.id ? "feed-card-dragover" : ""}`} draggable={role === "equipe"} onDragStart={(e) => { if (role !== "equipe") return; setDraggedId(content.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", content.id); }} onDragOver={(e) => { if (role !== "equipe" || !draggedId || draggedId === content.id) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverId !== content.id) setDragOverId(content.id); }} onDragLeave={(e) => { if (dragOverId === content.id) setDragOverId(null); }} onDrop={(e) => { e.preventDefault(); setDragOverId(null); const sourceId = draggedId || e.dataTransfer.getData("text/plain"); setDraggedId(null); if (!sourceId || sourceId === content.id) return; reorderFeed(sourceId, content.id); }} onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}><div className="feed-card-meta"><strong className="feed-post-number">{role === "equipe" && <span className="feed-drag-handle" title="Arraste para reposicionar o post"><GripVertical size={13} /></span>}POST <span>{content.postNumber}</span></strong><span className="feed-post-date">{formatDate(content.date)}</span><span className="feed-card-format">{formatLabel[content.format]}</span></div><button className="feed-tile" onClick={(event) => openDetail(content.id, event.currentTarget)} aria-label={`Abrir POST ${content.postNumber}, ${formatLabel[content.format]}: ${content.title}, ${statusLabel[content.status]}`}><MediaPreview content={content} brand={workspace.clientName} mode="grid" /><span className={`tile-status tile-${content.status}`} title={statusLabel[content.status]} aria-hidden="true">{content.status === "aprovado" ? <CheckCircle2 size={14} /> : <i />}{shortStatus[content.status]}</span><span className="tile-overlay"><strong>{content.title}</strong><small>{statusLabel[content.status]} · {formatDate(content.date)}</small></span></button></article>)}</div> : <div className="content-list">{displayedFeed.map((content) => <div key={content.id} className={`content-list-item ${role === "equipe" ? "feed-card-draggable" : ""} ${draggedId === content.id ? "feed-card-dragging" : ""} ${dragOverId === content.id ? "feed-card-dragover" : ""}`} draggable={role === "equipe"} onDragStart={(e) => { if (role !== "equipe") return; setDraggedId(content.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", content.id); }} onDragOver={(e) => { if (role !== "equipe" || !draggedId || draggedId === content.id) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverId !== content.id) setDragOverId(content.id); }} onDragLeave={(e) => { if (dragOverId === content.id) setDragOverId(null); }} onDrop={(e) => { e.preventDefault(); setDragOverId(null); const sourceId = draggedId || e.dataTransfer.getData("text/plain"); setDraggedId(null); if (!sourceId || sourceId === content.id) return; reorderFeed(sourceId, content.id); }} onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}><button className="content-list-row" onClick={(event) => openDetail(content.id, event.currentTarget)}>{role === "equipe" && <span className="feed-drag-handle" title="Arraste para reposicionar o post"><GripVertical size={16} /></span>}<span className="list-thumb"><MediaPreview content={content} brand={workspace.clientName} mode="list" /></span><span className="list-copy"><strong>POST {content.postNumber} · {content.title}</strong><small>{formatLabel[content.format]} · {formatDate(content.date)}</small></span><StatusBadge status={content.status} /><ArrowRight size={18} className="list-arrow" /></button></div>)}</div>}
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
            <div className="plan-layout"><PlanDocument key={`${clientId}-${activeMonthKey}`} plan={workspace.plan} monthKey={activeMonthKey} team={role === "equipe"} onChange={changePlanFile} /><aside className="plan-side"><div className="plan-side-card"><span className="section-kicker">STATUS DO DOCUMENTO</span><h3>{planStatusLabel[workspace.plan.status]}</h3><p>{workspace.plan.status === "rascunho" ? "A equipe ainda não enviou o planejamento deste mês." : "Confira o documento antes de aprovar. A aprovação do planejamento não aprova os posts individualmente."}</p>{role === "cliente" && workspace.plan.status === "aguardando" && <div className="plan-actions"><button className="primary-button" onClick={() => updatePlan("aprovado", "Planejamento aprovado")}><Check size={17} /> Aprovar planejamento</button><button className="outline-button" onClick={() => setPlanAdjustOpen(true)}><MessageCircle size={17} /> Pedir ajuste</button></div>}{role === "equipe" && (workspace.plan.status === "ajuste" || workspace.plan.status === "rascunho") && !!workspace.plan.file && <button className="primary-button" onClick={() => updatePlan("aguardando", "Planejamento reenviado para aprovação")}>Enviar para aprovação</button>}{role === "equipe" && workspace.plan.status === "aprovado" && <p className="plan-side-hint"><CheckCircle2 size={16} /> Planejamento aprovado. Uma nova versão deverá ter aprovação própria.</p>}</div><div className="plan-side-card"><span className="section-kicker">HISTÓRICO</span>{workspace.plan.activity.length ? workspace.plan.activity.map((activity) => <div className="activity-item" key={activity.id}><span className="activity-mark" /><div><strong>{activity.action}</strong><small>{activity.author} · {formatActivityDate(activity.at)} · v{activity.version}</small>{activity.note && <p>{activity.note}</p>}</div></div>) : <p>Nenhuma ação registrada.</p>}</div></aside></div>
          </>}
        </main>
      </div>

      {selected && <ContentDetail key={`${clientId}-${selected.id}`} content={selected} clientName={workspace.clientName} clientLogo={logoUrl ?? undefined} clientSlug={clientId} role={role} position={selectedPosition} total={currentList.length} onClose={closeDetail} onDelete={deleteSelectedContent} onNavigate={(direction) => { const next = currentList[selectedPosition + direction]; if (next) openDetail(next.id); }} onUpdate={(transform) => updateContent(selected.id, transform)} onActivityAdded={(activity) => setWorkspace((current) => ({ ...current, contents: current.contents.map((item) => item.id === selected.id ? { ...item, activity: [activity, ...item.activity] } : item) }))} onAction={(status, action, note, author) => actionOnContent(selected.id, status, action, note, author)} />}

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
            <button type="button" className="text-button danger-button" onClick={removeLogo}>Remover logo</button><button type="button" className="text-button" onClick={() => setLogoDraft({ scale: 100, x: 0, y: 0, border: false })}>Restaurar enquadramento</button>
            <div className="logo-modal-actions"><button type="button" className="outline-button" onClick={closeLogo}>Cancelar</button><button type="button" className="primary-button" onClick={applyLogoFrame}>Aplicar enquadramento</button></div>
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



      {instaFeedOpen && (
        <div
          className="insta-sim-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInstaFeedOpen(false);
          }}
        >
          <div className="insta-sim-container">
            <button
              type="button"
              className="insta-sim-close-btn"
              onClick={() => setInstaFeedOpen(false)}
              aria-label="Fechar simulação do Instagram"
            >
              <X size={20} />
            </button>

            <div className="insta-phone-shell">
              <div className="insta-phone-notch">
                <div className="insta-phone-camera" />
              </div>

              <div className="insta-phone-status-bar">
                <span>9:41</span>
                <div className="insta-phone-status-icons">
                  <span className="insta-phone-signal">●●●●</span>
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              <header className="insta-sim-header">
                <button
                  type="button"
                  className="insta-sim-back"
                  onClick={() => setInstaFeedOpen(false)}
                  aria-label="Voltar"
                >
                  <ChevronLeft size={22} />
                </button>
                <div className="insta-sim-title">
                  <span>{getInstagramHandle(workspace.clientName).replace("@", "")}</span>
                </div>
                <div className="insta-sim-top-actions">
                  <span aria-hidden="true">
                    <Bell size={20} />
                  </span>
                  <span aria-hidden="true">
                    <MoreHorizontal size={20} />
                  </span>
                </div>
              </header>

              {/* Clean Profile Header - NO bio, NO followers per user specification */}
              <div className="insta-sim-profile-bar">
                <div className="insta-sim-avatar-wrap">
                  <div className="insta-sim-avatar">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`Logo de ${workspace.clientName}`}
                        style={{
                          transform: `translate(${workspace.logoOffsetX ?? 0}%, ${workspace.logoOffsetY ?? 0}%) scale(${(workspace.logoScale ?? 100) / 100})`,
                        }}
                      />
                    ) : (
                      <span>{workspace.clientName.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                    )}
                  </div>
                </div>
                <div className="insta-sim-profile-text">
                  <strong>{workspace.clientName}</strong>
                  <span>{getInstagramHandle(workspace.clientName)} · Grade do feed</span>
                </div>
              </div>

              <div className="insta-sim-scope" aria-label="Período da prévia do feed">
                <span>Prévia do feed</span>
                <div className="insta-sim-scope-options">
                  <button type="button" className={instaScope === "mes" ? "is-active" : ""} aria-pressed={instaScope === "mes"} onClick={() => setInstaScope("mes")}>Mês selecionado</button>
                  <button type="button" className={instaScope === "todos" ? "is-active" : ""} aria-pressed={instaScope === "todos"} onClick={() => void showAllFeed()}>Todo o portal</button>
                </div>
              </div>

              {/* Instagram Profile Tabs */}
              <div className="insta-sim-tabs">
                <span className="insta-sim-tab is-active" aria-label="Publicações">
                  <Grid size={18} />
                </span>
                <span className="insta-sim-tab" aria-label="Reels">
                  <Film size={18} />
                </span>
                <span className="insta-sim-tab" aria-label="Marcados">
                  <UserCheck size={18} />
                </span>
              </div>

              {/* 3-Column Instagram Feed Grid */}
              <div className="insta-sim-scroll-area">
                <div className="insta-sim-grid">
                  {simulatedFeed.map(({ content, monthKey }) => (
                    <button
                      key={`${monthKey}-${content.id}`}
                      type="button"
                      className="insta-sim-tile"
                      onClick={() => openSimulatedContent(content.id, monthKey)}
                      aria-label={`Abrir POST ${content.postNumber} de ${monthName(monthKey)}: ${content.title}`}
                    >
                      <MediaPreview content={content} brand={workspace.clientName} mode="grid" />
                      {content.format === "reels" && (
                        <div className="insta-sim-tile-badge" title="Reels / Vídeo">
                          <Play size={13} fill="#ffffff" />
                        </div>
                      )}
                      {content.format === "carrossel" && (
                        <div className="insta-sim-tile-badge" title="Carrossel">
                          <Layers size={13} fill="#ffffff" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {allFeedLoading && instaScope === "todos" && <div className="insta-sim-empty" role="status">Carregando os meses…</div>}
                {allFeedError && instaScope === "todos" && <div className="insta-sim-empty" role="alert">{allFeedError}</div>}
                {!allFeedLoading && !allFeedError && simulatedFeed.length === 0 && (
                  <div className="insta-sim-empty">Nenhum post disponível nesta prévia.</div>
                )}
              </div>

              {/* Bottom Nav Bar */}
              <nav className="insta-sim-bottom-bar" aria-label="Navegação Instagram">
                <span className="insta-sim-nav-icon"><Home size={21} /></span>
                <span className="insta-sim-nav-icon"><Search size={21} /></span>
                <span className="insta-sim-nav-icon"><PlusSquare size={21} /></span>
                <span className="insta-sim-nav-icon"><Film size={21} /></span>
                <span className="insta-sim-nav-avatar">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      style={{
                        transform: `translate(${workspace.logoOffsetX ?? 0}%, ${workspace.logoOffsetY ?? 0}%) scale(${(workspace.logoScale ?? 100) / 100})`,
                      }}
                    />
                  ) : (
                    workspace.clientName.split(" ").map((p) => p[0]).slice(0, 2).join("")
                  )}
                </span>
              </nav>
            </div>
          </div>
        </div>
      )}

      {restoreModalOpen && (
        <div
          className="small-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setRestoreModalOpen(false);
              setRestoreConfirmText("");
            }
          }}
        >
          <div className="small-modal restore-safety-modal" role="dialog" aria-modal="true" aria-labelledby="restore-safety-title">
            <button
              type="button"
              className="icon-button small-modal-close"
              onClick={() => {
                setRestoreModalOpen(false);
                setRestoreConfirmText("");
              }}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <span className="section-kicker" style={{ color: "#d97706" }}>ZONA DE PROTEÇÃO DE DADOS</span>
            <h2 id="restore-safety-title" style={{ fontSize: "22px" }}>Restaurar demonstração local?</h2>
            <div style={{ display: "grid", gap: "8px", margin: "10px 0", fontSize: "12px", color: "#4e5e53", lineHeight: 1.5 }}>
              <p>
                <strong>Atenção:</strong> Esta ação redefine a visualização do seu navegador para os <strong>posts de exemplo iniciais</strong>.
              </p>
              <p>
                Seus conteúdos salvos no banco de dados na nuvem (Supabase) <strong>não serão apagados</strong>, mas para evitar cliques acidentais e perda do que você estava visualizando, digite <strong>RESTAURAR</strong> abaixo para liberar a ação:
              </p>
            </div>

            <label htmlFor="confirm-restore-input" style={{ fontSize: "11px", fontWeight: 700, color: "#324438", marginTop: "6px" }}>
              Digite a palavra de segurança:
            </label>
            <input
              id="confirm-restore-input"
              type="text"
              autoComplete="off"
              placeholder="Digite RESTAURAR"
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: "13px", fontWeight: 600, letterSpacing: "1px", borderRadius: "6px", border: "2px solid #dcd7cb" }}
              autoFocus
            />

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => {
                  setRestoreModalOpen(false);
                  setRestoreConfirmText("");
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={restoreConfirmText.trim().toUpperCase() !== "RESTAURAR"}
                onClick={handleConfirmRestoreDemo}
                style={{
                  background: restoreConfirmText.trim().toUpperCase() === "RESTAURAR" ? "#c94a29" : "#ccc",
                  borderColor: restoreConfirmText.trim().toUpperCase() === "RESTAURAR" ? "#c94a29" : "#ccc",
                  color: "#fff",
                  cursor: restoreConfirmText.trim().toUpperCase() === "RESTAURAR" ? "pointer" : "not-allowed",
                }}
              >
                Restaurar demonstração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
