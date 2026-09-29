import { supabase, getSupabaseAdmin } from "./supabase";
import {
  Content,
  ContentFormat,
  ContentStatus,
  MonthCycle,
  PlanStatus,
  Workspace,
  ensurePostNumbers,
  todayStamp,
} from "./demo";

export type ClientRecord = {
  id: string;
  name: string;
  access_token: string;
  logo_url: string | null;
  logo_scale: number;
  logo_offset_x: number;
  logo_offset_y: number;
  logo_border: boolean;
  created_at: string;
};

// Obter cliente pelo token exclusivo (usado no link do cliente /c/[token])
export async function getClientByToken(token: string): Promise<ClientRecord | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("clients")
      .select("*")
      .eq("access_token", token)
      .maybeSingle();

    if (data) return data as ClientRecord;
  } catch (err) {
    console.warn("Consulta do cliente por token no Supabase falhou:", err);
  }

  // Fallback garantido usando demoClients
  const { demoClients } = await import("./demo");
  const demo = demoClients.find((c) => c.accessToken === token || c.id === token);
  if (demo) {
    return {
      id: demo.id,
      name: demo.name,
      access_token: demo.accessToken,
      logo_url: null,
      logo_scale: 100,
      logo_offset_x: 0,
      logo_offset_y: 0,
      logo_border: false,
      created_at: new Date().toISOString(),
    };
  }

  return null;
}

// Listar todos os clientes (para painel admin)
export async function getAllClients(): Promise<ClientRecord[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("clients")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as ClientRecord[];
    }
  } catch (err) {
    console.warn("Consulta de clientes no Supabase falhou:", err);
  }

  // Fallback com os 5 clientes garantidos
  const { demoClients } = await import("./demo");
  return demoClients.map((c) => ({
    id: c.id,
    name: c.name,
    access_token: c.accessToken,
    logo_url: null,
    logo_scale: 100,
    logo_offset_x: 0,
    logo_offset_y: 0,
    logo_border: false,
    created_at: new Date().toISOString(),
  }));
}

// Criar um novo cliente no banco
export async function createClient(name: string): Promise<ClientRecord | null> {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const id = `${slug || "cliente"}-${Date.now().toString().slice(-4)}`;
  const token = `${slug || "cliente"}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const admin = getSupabaseAdmin();

  try {
    const { data, error } = await admin
      .from("clients")
      .insert({
        id,
        name,
        access_token: token,
      })
      .select()
      .single();

    if (!error && data) {
      // Criar ciclo de mês inicial
      await admin.from("month_cycles").upsert({
        client_id: id,
        month_key: "2026-09",
        month_name: "Setembro de 2026",
        plan_status: "rascunho",
        plan_version: 1,
        next_post_number: 1,
      }, { onConflict: "client_id,month_key" });

      return data as ClientRecord;
    }
  } catch (err) {
    console.error("Erro ao criar cliente no Supabase:", err);
  }

  return {
    id,
    name,
    access_token: token,
    logo_url: null,
    logo_scale: 100,
    logo_offset_x: 0,
    logo_offset_y: 0,
    logo_border: false,
    created_at: new Date().toISOString(),
  };
}

// Atualizar logo e enquadramento do cliente
export async function updateClientLogoSettings(
  clientId: string,
  updates: {
    logo_url?: string | null;
    logo_scale?: number;
    logo_offset_x?: number;
    logo_offset_y?: number;
    logo_border?: boolean;
  }
) {
  const admin = getSupabaseAdmin();
  const sanitized: Record<string, any> = {};

  if (updates.logo_url !== undefined) sanitized.logo_url = updates.logo_url;
  if (updates.logo_scale !== undefined && updates.logo_scale !== null) {
    sanitized.logo_scale = Math.round(Number(updates.logo_scale));
  }
  if (updates.logo_offset_x !== undefined && updates.logo_offset_x !== null) {
    sanitized.logo_offset_x = Math.round(Number(updates.logo_offset_x));
  }
  if (updates.logo_offset_y !== undefined && updates.logo_offset_y !== null) {
    sanitized.logo_offset_y = Math.round(Number(updates.logo_offset_y));
  }
  if (updates.logo_border !== undefined && updates.logo_border !== null) {
    sanitized.logo_border = Boolean(updates.logo_border);
  }

  const { error } = await admin
    .from("clients")
    .update(sanitized)
    .eq("id", clientId);

  if (error) {
    console.error("Erro ao atualizar logo do cliente:", error);
    throw error;
  }
}

// Carregar o workspace completo de um cliente (ciclos, plano, posts)
export async function loadWorkspaceData(
  clientId: string,
  targetMonthKey = "2026-09"
): Promise<Workspace | null> {
  const admin = getSupabaseAdmin();

  // 1. Buscar cliente
  const { data: client, error: clientErr } = await admin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (clientErr || !client) return null;

  // 2. Buscar ciclos mensais
  const { data: cycles } = await admin
    .from("month_cycles")
    .select("*")
    .eq("client_id", clientId);

  const monthsMap: Record<string, MonthCycle> = {};
  if (cycles) {
    for (const c of cycles) {
      monthsMap[c.month_key] = {
        plan: {
          status: c.plan_status as PlanStatus,
          version: c.plan_version,
          file: c.plan_file_url
            ? {
                id: c.id,
                name: c.plan_file_name || "Planejamento editorial",
                type: "application/pdf",
                size: 0,
                addedAt: c.created_at,
                url: c.plan_file_url,
              }
            : undefined,
          activity: [],
        },
        contents: [],
        nextPostNumber: c.next_post_number || 1,
      };
    }
  }

  // 3. Buscar posts/stories do mês em foco
  const { data: contentsData } = await admin
    .from("contents")
    .select(`
      *,
      activities:activities(*)
    `)
    .eq("client_id", clientId)
    .eq("month_key", targetMonthKey)
    .order("post_number", { ascending: true, nullsFirst: false });

  const contents: Content[] = (contentsData || []).map((row) => {
    const rawMedia = (row.media_urls || []) as any[];
    const videoItem = rawMedia.find((m: any) => m.type?.startsWith("video/")) || rawMedia[0];
    const coverAttachment = rawMedia.find((m: any) => m.name?.startsWith("Capa · ") || (m.coverScale !== undefined && m.coverScale !== 100));
    const coverScale = coverAttachment?.coverScale ?? videoItem?.coverScale ?? (rawMedia.find((m: any) => m.coverScale !== undefined)?.coverScale);
    const coverOffsetX = coverAttachment?.coverOffsetX ?? videoItem?.coverOffsetX ?? (rawMedia.find((m: any) => m.coverOffsetX !== undefined)?.coverOffsetX);
    const coverOffsetY = coverAttachment?.coverOffsetY ?? videoItem?.coverOffsetY ?? (rawMedia.find((m: any) => m.coverOffsetY !== undefined)?.coverOffsetY);
    const coverUrl = coverAttachment?.url ?? videoItem?.coverUrl ?? (rawMedia.find((m: any) => m.coverUrl)?.coverUrl);
    const coverFileId = coverAttachment?.id ?? videoItem?.coverFileId ?? (rawMedia.find((m: any) => m.coverFileId)?.coverFileId);

    const primaryMedia = row.format === "reels"
      ? (rawMedia.filter((m: any) => m.type?.startsWith("video/")).length > 0 ? rawMedia.filter((m: any) => m.type?.startsWith("video/")) : rawMedia)
      : row.format === "carrossel"
      ? (rawMedia.filter((m: any) => !m.name?.startsWith("Capa · ") && m.type?.startsWith("image/")).length > 0 ? rawMedia.filter((m: any) => !m.name?.startsWith("Capa · ") && m.type?.startsWith("image/")) : rawMedia)
      : (rawMedia.filter((m: any) => !m.name?.startsWith("Capa · ")).length > 0 ? rawMedia.filter((m: any) => !m.name?.startsWith("Capa · ")) : rawMedia);

    return {
      id: row.id,
      postNumber: row.post_number ?? undefined,
      title: row.title,
      category: row.category,
      format: row.format as ContentFormat,
      date: row.date,
      status: row.status as ContentStatus,
      caption: row.caption || "",
      cta: row.cta || "",
      cover: 0,
      version: row.version || 1,
      publishedUrl: row.published_url || undefined,
      sharedToStory: row.shared_to_story || false,
      coverScale,
      coverOffsetX,
      coverOffsetY,
      coverUrl,
      coverFileId,
      media: primaryMedia,
      attachments: rawMedia,
      activity: (row.activities || []).map((a: any) => ({
        id: a.id,
        author: a.author,
        action: a.action,
        note: a.note || undefined,
        at: a.created_at,
        version: a.version || 1,
      })),
    };
  });

  const activeCycle = monthsMap[targetMonthKey] || {
    plan: {
      status: "rascunho" as PlanStatus,
      version: 1,
      activity: [],
    },
    contents: [],
    nextPostNumber: 1,
  };

  const [year, month] = targetMonthKey.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return {
    clientName: client.name,
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    monthKey: targetMonthKey,
    months: monthsMap,
    logoFileId: client.logo_url || undefined,
    logoScale: client.logo_scale ?? 100,
    logoOffsetX: client.logo_offset_x ?? 0,
    logoOffsetY: client.logo_offset_y ?? 0,
    logoBorder: client.logo_border ?? false,
    plan: activeCycle.plan,
    contents: ensurePostNumbers(contents),
    nextPostNumber: activeCycle.nextPostNumber,
  };
}

// Salvar ou atualizar post
export async function saveContentRecord(
  clientId: string,
  monthKey: string,
  content: Partial<Content> & { title?: string; format?: ContentFormat; date?: string }
): Promise<string> {
  const admin = getSupabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(content.id || "");
  const id = isUuid ? (content.id as string) : crypto.randomUUID();

  const record: Record<string, any> = {
    id,
    client_id: clientId,
    month_key: monthKey,
  };

  if (content.title !== undefined) record.title = content.title;
  if (content.category !== undefined) record.category = content.category;
  if (content.format !== undefined) record.format = content.format;
  if (content.date !== undefined) record.date = content.date;
  if (content.status !== undefined) record.status = content.status;
  if (content.caption !== undefined) record.caption = content.caption;
  if (content.cta !== undefined) record.cta = content.cta;
  if (content.version !== undefined) record.version = content.version;
  if (content.publishedUrl !== undefined) record.published_url = content.publishedUrl;
  if (content.sharedToStory !== undefined) record.shared_to_story = content.sharedToStory;
  if (content.media !== undefined || content.attachments !== undefined) {
    const attachmentsList = content.attachments ?? [];
    const mediaList = content.media ?? [];
    const mergedMap = new Map<string, any>();
    for (const item of mediaList) {
      if (item && item.id) mergedMap.set(item.id, item);
    }
    for (const item of attachmentsList) {
      if (item && item.id) {
        const existing = mergedMap.get(item.id);
        mergedMap.set(item.id, existing ? { ...existing, ...item } : item);
      }
    }
    // Also propagate content-level cover properties to the video or primary media item
    if (content.coverScale !== undefined || content.coverOffsetX !== undefined || content.coverOffsetY !== undefined) {
      for (const [id, item] of mergedMap.entries()) {
        if (item.type?.startsWith("video/") || item.id === content.coverFileId || item.name?.startsWith("Capa · ")) {
          mergedMap.set(id, {
            ...item,
            coverScale: content.coverScale ?? item.coverScale,
            coverOffsetX: content.coverOffsetX ?? item.coverOffsetX,
            coverOffsetY: content.coverOffsetY ?? item.coverOffsetY,
            coverUrl: content.coverUrl ?? item.coverUrl,
            coverFileId: content.coverFileId ?? item.coverFileId,
          });
        }
      }
    }
    record.media_urls = Array.from(mergedMap.values());
  }
  if (content.postNumber !== undefined) record.post_number = content.postNumber;

  const { data, error } = await admin
    .from("contents")
    .upsert(record, { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    console.error("Erro no upsert de contents:", error);
    throw error;
  }
  return data.id;
}

// Registrar atividade (aprovação, ajuste, comentário)
export async function addActivityRecord(
  contentId: string,
  author: string,
  action: string,
  note?: string,
  version = 1
): Promise<string | undefined> {
  const admin = getSupabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contentId);
  if (!isUuid) return undefined;
  const { data, error } = await admin
    .from("activities")
    .insert({
      content_id: contentId,
      author,
      action,
      note,
      version,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao registrar atividade:", error);
    return undefined;
  }
  return data?.id;
}

// Atualizar atividade existente (edição pelo admin)
export async function updateActivityRecord(
  activityId: string,
  updates: { author?: string; action?: string; note?: string }
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(activityId);
  if (!isUuid) return false;
  const payload: Record<string, any> = {};
  if (updates.author !== undefined) payload.author = updates.author;
  if (updates.action !== undefined) payload.action = updates.action;
  if (updates.note !== undefined) payload.note = updates.note;
  const { error } = await admin.from("activities").update(payload).eq("id", activityId);
  if (error) {
    console.error("Erro ao atualizar atividade:", error);
    return false;
  }
  return true;
}

// Excluir atividade (remoção pelo admin)
export async function deleteActivityRecord(activityId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(activityId);
  if (!isUuid) return false;
  const { error } = await admin.from("activities").delete().eq("id", activityId);
  if (error) {
    console.error("Erro ao excluir atividade:", error);
    return false;
  }
  return true;
}

// Deletar post
export async function deleteContentRecord(contentId: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("contents").delete().eq("id", contentId);
  if (error) throw error;
}

// Atualizar status do planejamento do mês
export async function updatePlanStatusRecord(
  clientId: string,
  monthKey: string,
  status: PlanStatus,
  action: string,
  author: string,
  note?: string,
  fileUrl?: string,
  fileName?: string
) {
  const admin = getSupabaseAdmin();
  const updates: Record<string, any> = {
    plan_status: status,
  };
  if (fileUrl) {
    updates.plan_file_url = fileUrl;
    updates.plan_file_name = fileName || "Planejamento editorial";
  }

  const { data: cycle } = await admin
    .from("month_cycles")
    .upsert(
      {
        client_id: clientId,
        month_key: monthKey,
        month_name: monthKey,
        ...updates,
      },
      { onConflict: "client_id,month_key" }
    )
    .select("id, plan_version")
    .single();

  if (cycle) {
    await admin.from("activities").insert({
      month_cycle_id: cycle.id,
      author,
      action,
      note,
      version: cycle.plan_version || 1,
    });
  }
}

