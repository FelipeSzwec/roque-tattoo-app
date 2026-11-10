-- Estrutura do banco do Roque Tattoo App (Supabase / Postgres).
-- Cada usuário só enxerga e altera os próprios lançamentos (Row Level Security).

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null default current_date,
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor numeric(12, 2) not null check (valor > 0),
  categoria text not null,
  grupo text not null check (grupo in ('receita', 'fixo', 'variavel', 'imposto', 'pessoal')),
  forma_pagamento text check (forma_pagamento in ('pix', 'dinheiro', 'cartao')),
  descricao text,
  exemplo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lancamentos_user_data_idx on public.lancamentos (user_id, data desc);

alter table public.lancamentos enable row level security;

drop policy if exists "lancamentos: ver os seus" on public.lancamentos;
create policy "lancamentos: ver os seus" on public.lancamentos
  for select using (auth.uid() = user_id);

drop policy if exists "lancamentos: criar os seus" on public.lancamentos;
create policy "lancamentos: criar os seus" on public.lancamentos
  for insert with check (auth.uid() = user_id);

drop policy if exists "lancamentos: alterar os seus" on public.lancamentos;
create policy "lancamentos: alterar os seus" on public.lancamentos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lancamentos: excluir os seus" on public.lancamentos;
create policy "lancamentos: excluir os seus" on public.lancamentos
  for delete using (auth.uid() = user_id);

-- Contas fixas (repetem todo mês) e configurações do financeiro
create table if not exists public.contas_fixas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  categoria text not null,
  grupo text not null default 'fixo' check (grupo in ('fixo', 'variavel', 'imposto', 'pessoal')),
  valor numeric(12, 2) not null check (valor >= 0),
  dia smallint not null default 5 check (dia between 1 and 31),
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.contas_fixas enable row level security;
create policy "contas_fixas: ver as suas" on public.contas_fixas for select to authenticated using ((select auth.uid()) = user_id);
create policy "contas_fixas: criar as suas" on public.contas_fixas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "contas_fixas: alterar as suas" on public.contas_fixas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "contas_fixas: excluir as suas" on public.contas_fixas for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.config_financeira (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  taxa_credito numeric(5, 2) not null default 0,
  taxa_debito numeric(5, 2) not null default 0,
  imposto_pct numeric(5, 2) not null default 0,
  onboarding_ok boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.config_financeira enable row level security;
create policy "config: ver a sua" on public.config_financeira for select to authenticated using ((select auth.uid()) = user_id);
create policy "config: criar a sua" on public.config_financeira for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "config: alterar a sua" on public.config_financeira for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.lancamentos add column if not exists conta_id uuid references public.contas_fixas (id) on delete set null;
alter table public.lancamentos drop constraint if exists lancamentos_forma_pagamento_check;
alter table public.lancamentos add constraint lancamentos_forma_pagamento_check check (forma_pagamento in ('pix', 'dinheiro', 'cartao', 'credito', 'debito'));
