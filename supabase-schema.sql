-- ==========================================================
-- SCHEMA DO PORTAL DE CLIENTES NUREA (SUPABASE POSTGRESQL)
-- ==========================================================

-- 1. Habilitar extensão para UUID se necessário
create extension if not exists "uuid-ossp";

-- 2. Tabela de Clientes com Token de Acesso Exclusivo
create table if not exists public.clients (
  id text primary key,
  name text not null,
  access_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  logo_url text,
  logo_scale integer default 100,
  logo_offset_x integer default 0,
  logo_offset_y integer default 0,
  logo_border boolean default false,
  created_at timestamptz default now() not null
);

-- 3. Tabela de Ciclos Mensais e Planejamento
create table if not exists public.month_cycles (
  id uuid default gen_random_uuid() primary key,
  client_id text references public.clients(id) on delete cascade not null,
  month_key text not null, -- Ex: '2026-09'
  month_name text not null, -- Ex: 'Setembro de 2026'
  plan_status text default 'rascunho' not null,
  plan_version integer default 1 not null,
  plan_file_url text,
  plan_file_name text,
  plan_example_removed boolean default false not null,
  next_post_number integer default 1 not null,
  created_at timestamptz default now() not null,
  unique(client_id, month_key)
);

-- 4. Tabela de Posts do Feed e Stories
create table if not exists public.contents (
  id uuid default gen_random_uuid() primary key,
  client_id text references public.clients(id) on delete cascade not null,
  month_key text not null,
  post_number integer,
  title text not null,
  category text default 'Geral' not null,
  format text not null, -- 'arte', 'carrossel', 'reels', 'story'
  date text not null,
  status text default 'producao' not null,
  caption text default '',
  cta text default '',
  version integer default 1 not null,
  media_urls jsonb default '[]'::jsonb not null,
  published_url text,
  shared_to_story boolean default false,
  created_at timestamptz default now() not null
);

-- 5. Tabela de Histórico de Atividades / Aprovações
create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  content_id uuid references public.contents(id) on delete cascade,
  month_cycle_id uuid references public.month_cycles(id) on delete cascade,
  author text not null,
  action text not null,
  note text,
  version integer default 1 not null,
  created_at timestamptz default now() not null
);

-- 6. Habilitar Políticas de Acesso (RLS)
alter table public.clients enable row level security;
alter table public.month_cycles enable row level security;
alter table public.contents enable row level security;
alter table public.activities enable row level security;

-- Toda leitura/escrita passa pelas rotas Next.js autenticadas com service role.
-- Nunca exponha estas tabelas diretamente para anon/authenticated.
drop policy if exists "Permitir tudo clients" on public.clients;

drop policy if exists "Permitir tudo month_cycles" on public.month_cycles;

drop policy if exists "Permitir tudo contents" on public.contents;

drop policy if exists "Permitir tudo activities" on public.activities;

revoke all on public.clients, public.month_cycles, public.contents, public.activities from anon, authenticated;

-- 7. Cadastrar os 5 clientes de exemplo com tokens exclusivos
insert into public.clients (id, name, access_token) values
  ('meliza-doces', 'Meliza Doces', replace(gen_random_uuid()::text, '-', '')),
  ('studio-rose-brighenti', 'Studio Rose Brighenti', replace(gen_random_uuid()::text, '-', '')),
  ('estofados-campinas', 'Estofados Campinas', replace(gen_random_uuid()::text, '-', '')),
  ('emporio-do-cafe', 'Empório do Café', replace(gen_random_uuid()::text, '-', '')),
  ('dr-marcelo-costa', 'Dr. Marcelo Costa', replace(gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;
