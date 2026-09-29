-- Executar no projeto Supabase existente antes de usar dados de clientes.
alter table public.month_cycles add column if not exists plan_example_removed boolean default false not null;
alter table public.clients enable row level security;
alter table public.month_cycles enable row level security;
alter table public.contents enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Permitir tudo clients" on public.clients;
drop policy if exists "Permitir tudo month_cycles" on public.month_cycles;
drop policy if exists "Permitir tudo contents" on public.contents;
drop policy if exists "Permitir tudo activities" on public.activities;

revoke all on public.clients, public.month_cycles, public.contents, public.activities from anon, authenticated;
