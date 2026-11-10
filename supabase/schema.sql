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
