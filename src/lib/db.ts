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
  const { error } = await admin
    .from("clients")
    .update(updates)
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

  const contents: Content[] = (contentsData || []).map((row) => ({
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
    media: (row.media_urls || []) as any[],
    attachments: (row.media_urls || []) as any[],
    activity: (row.activities || []).map((a: any) => ({
      id: a.id,
      author: a.author,
      action: a.action,
      note: a.note || undefined,
      at: a.created_at,
      version: a.version || 1,
    })),
  }));

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
  if (content.media !== undefined) record.media_urls = content.media;
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
) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("activities").insert({
    content_id: contentId,
    author,
    action,
    note,
    version,
  });

  if (error) console.error("Erro ao registrar atividade:", error);
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

