export type ContentFormat = "arte" | "carrossel" | "reels" | "story";
export type ContentStatus = "producao" | "aguardando" | "ajuste" | "aprovado" | "agendado" | "publicado";
export type PlanStatus = "rascunho" | "aguardando" | "ajuste" | "aprovado";

export type Activity = {
  id: string;
  author: string;
  action: string;
  note?: string;
  at: string;
  version: number;
};

export type Attachment = { id: string; name: string; type: string; size: number; addedAt: string; url?: string; coverUrl?: string; coverFileId?: string };

export type Content = {
  id: string;
  postNumber?: number;
  title: string;
  category: string;
  format: ContentFormat;
  date: string;
  status: ContentStatus;
  caption: string;
  cta: string;
  cover: number;
  version: number;
  slides?: string[];
  mediaUrl?: string;
  publishedUrl?: string;
  sharedToStory?: boolean;
  media?: Attachment[];
  attachments?: Attachment[];
  activity: Activity[];
};

export type MonthCycle = { plan: { status: PlanStatus; version: number; activity: Activity[]; file?: Attachment; exampleRemoved?: boolean }; contents: Content[]; nextPostNumber?: number };

export type Workspace = {
  clientName: string;
  month: string;
  monthKey?: string;
  months?: Record<string, MonthCycle>;
  logoFileId?: string;
  logoScale?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  logoBorder?: boolean;
} & MonthCycle;

export function ensurePostNumbers(contents: Content[]): Content[] {
  const feed = contents.filter((content) => content.format !== "story");
  const assigned = new Set<number>();
  for (const content of feed) {
    const fromId = Number(content.id.match(/^post-(\d+)$/)?.[1]);
    const number = content.postNumber ?? (Number.isFinite(fromId) && fromId > 0 ? fromId : undefined);
    if (number) assigned.add(number);
  }
  let next = 1;
  return contents.map((content) => {
    if (content.format === "story" || content.postNumber) return content;
    const fromId = Number(content.id.match(/^post-(\d+)$/)?.[1]);
    const number = Number.isFinite(fromId) && fromId > 0 ? fromId : undefined;
    if (number) return { ...content, postNumber: number };
    while (assigned.has(next)) next += 1;
    assigned.add(next);
    return { ...content, postNumber: next++ };
  });
}

export const formatLabel: Record<ContentFormat, string> = {
  arte: "Arte", carrossel: "Carrossel", reels: "Reels", story: "Story original",
};

export const statusLabel: Record<ContentStatus, string> = {
  producao: "Em preparação", aguardando: "Aguardando aprovação", ajuste: "Ajuste solicitado",
  aprovado: "Aprovado", agendado: "Agendado", publicado: "Publicado",
};

export const planStatusLabel: Record<PlanStatus, string> = {
  rascunho: "Ainda não enviado", aguardando: "Aguardando aprovação", ajuste: "Ajuste solicitado", aprovado: "Aprovado",
};

type DemoClient = {
  id: string;
  name: string;
  theme: string;
  posts: readonly [string, string, string, string, string, string, string, string];
};

export const demoClients: readonly DemoClient[] = [
  {
    id: "meliza-doces", name: "Meliza Doces", theme: "doces",
    posts: ["Um doce para começar o mês", "Bastidores da confeitaria", "Ideias para uma mesa especial", "O cuidado em cada detalhe", "Um sabor para compartilhar", "Inspiração para comemorar", "Como nasce uma criação", "Momentos que pedem doçura"],
  },
  {
    id: "studio-rose-brighenti", name: "Studio Rose Brighenti", theme: "beleza",
    posts: ["Seu estilo, sua expressão", "Bastidores de um atendimento", "Cuidados para o dia a dia", "O poder de uma mudança", "Detalhes de uma transformação", "Rotina de autocuidado", "Um novo olhar para os fios", "Beleza que acompanha você"],
  },
  {
    id: "papillon-parfums", name: "Papillon Parfums", theme: "fragrâncias",
    posts: ["A memória de uma fragrância", "Bastidores de uma escolha", "Notas para descobrir", "Seu perfume, sua presença", "Inspiração em cada detalhe", "Como escolher uma fragrância", "O ritual de perfumar", "Uma nova forma de sentir"],
  },
  {
    id: "elite-academia", name: "Elite Academia", theme: "movimento",
    posts: ["Seu movimento começa hoje", "Bastidores da rotina de treino", "Pequenos passos, constância", "Treinar no seu ritmo", "Energia para continuar", "Um hábito de cada vez", "Movimento para o dia a dia", "Seu próximo passo"],
  },
  {
    id: "centro-de-danca-impulso", name: "Centro de Dança Impulso", theme: "dança",
    posts: ["A dança começa no primeiro passo", "Bastidores de uma aula", "Movimento que conta histórias", "Um espaço para se expressar", "O ritmo de cada pessoa", "Entre passos e descobertas", "A energia de dançar juntos", "Novas formas de se mover"],
  },
];

export const defaultClientId = demoClients[0].id;

const formats: readonly ContentFormat[] = ["arte", "reels", "carrossel", "arte", "reels", "arte", "carrossel", "arte"];
const statuses: readonly ContentStatus[] = ["publicado", "agendado", "aguardando", "ajuste", "aguardando", "aprovado", "producao", "producao"];
const dates = ["2026-09-18", "2026-09-21", "2026-09-23", "2026-09-25", "2026-09-27", "2026-09-29", "2026-10-02", "2026-10-05"];
const categories = ["Apresentação", "Bastidores", "Educativo", "Conexão", "Produto", "Marca", "Educativo", "Conexão"];

function createWorkspace(client: DemoClient): Workspace {
  const contents: Content[] = client.posts.map((title, index) => {
    const format = formats[index];
    const status = statuses[index];
    const base = `post-${String(index + 1).padStart(2, "0")}`;
    const caption = index === 1
      ? `Um pouco do que acontece por trás de ${client.theme}. Cada etapa tem intenção, cuidado e uma história para contar. Qual parte você gostaria de conhecer melhor?`
      : `${title}. Uma ideia para explorar ${client.theme} com mais atenção e criar uma conexão verdadeira com quem acompanha a marca. O que esse tema desperta em você?`;
    return {
      id: base, postNumber: index + 1, title, category: categories[index], format, date: dates[index], status,
      caption, cta: "", cover: index + 1, version: 1,
      ...(format === "carrossel" ? { slides: [title, "01 · Descubra a ideia", "02 · Observe os detalhes", "03 · Leve para o seu dia"] } : {}),
      activity: status === "ajuste" ? [{ id: `${base}-activity`, author: "Cliente (demonstração)", action: "Ajuste solicitado · legenda", note: "Podemos deixar a mensagem mais direta?", at: "2026-09-20T16:15:00.000Z", version: 1 }] : [],
    };
  });
  contents.push({
    id: "story-01", title: `Uma novidade sobre ${client.theme}`, category: "Story original", format: "story",
    date: "2026-09-24", status: "aguardando", caption: `Uma breve atualização para quem acompanha o universo de ${client.theme}.`,
    cta: "", cover: 9, version: 1, activity: [],
  });
  return {
    clientName: client.name,
    month: "Setembro de 2026",
    monthKey: "2026-09",
    plan: { status: "aprovado", version: 1, activity: [{ id: "plan-a1", author: "Cliente (demonstração)", action: "Planejamento aprovado", at: "2026-09-02T14:30:00.000Z", version: 1 }] },
    contents,
  };
}

export const initialWorkspaces: Record<string, Workspace> = Object.fromEntries(demoClients.map((client) => [client.id, createWorkspace(client)]));

export function todayStamp() { return new Date().toISOString(); }

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

export function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}
