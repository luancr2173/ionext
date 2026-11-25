-- IONEXT CRM — ambientes por ramo de atuação (multi-tenant)
-- Núcleo único + template de nicho copiado para cada cliente no cadastro.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Templates de nicho
-- ---------------------------------------------------------------------------
create table public.segments (
  slug        text primary key,
  nome        text not null,
  descricao   text not null default '',
  icone       text not null default 'briefcase',
  ordem       int  not null default 0,
  versao      int  not null default 1,
  ativo       boolean not null default true,
  -- config: { labels, modulos[], etapas[], campos[], agenda_tipos[], neo }
  config      jsonb not null
);

-- ---------------------------------------------------------------------------
-- Ambiente do cliente (tenant)
-- ---------------------------------------------------------------------------
create table public.tenants (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null check (char_length(nome) between 2 and 120),
  cnpj             text,
  segment_slug     text not null references public.segments(slug),
  template_versao  int  not null,
  -- cópia de labels, agenda_tipos e neo do template (o cliente pode personalizar)
  config           jsonb not null default '{}'::jsonb,
  criado_por       uuid not null references auth.users(id) on delete restrict,
  criado_em        timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  papel      text not null default 'membro' check (papel in ('dono','admin','membro')),
  criado_em  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members(user_id);

create table public.tenant_modules (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  chave      text not null,
  tipo       text not null check (tipo in ('painel','contatos','funil','agenda','entidade')),
  rotulo     text not null,
  icone      text not null default 'circle',
  entidade   text,               -- só para tipo = 'entidade'
  ordem      int  not null default 0,
  ativo      boolean not null default true,
  unique (tenant_id, chave)
);

create table public.pipeline_stages (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  nome       text not null,
  ordem      int  not null default 0,
  cor        text not null default '#8a8f98',
  tipo       text not null default 'aberta' check (tipo in ('aberta','ganho','perdido'))
);
create index pipeline_stages_tenant_idx on public.pipeline_stages(tenant_id, ordem);

create table public.field_definitions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  entidade     text not null default 'contato',
  chave        text not null check (chave ~ '^[a-z][a-z0-9_]{0,40}$'),
  rotulo       text not null,
  tipo         text not null check (tipo in ('texto','textarea','numero','moeda','data','select','telefone','email','booleano')),
  opcoes       jsonb not null default '[]'::jsonb,
  obrigatorio  boolean not null default false,
  ordem        int not null default 0,
  unique (tenant_id, entidade, chave)
);
create index field_definitions_tenant_idx on public.field_definitions(tenant_id, entidade, ordem);

-- ---------------------------------------------------------------------------
-- Dados do CRM
-- ---------------------------------------------------------------------------
create table public.contacts (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  nome           text not null check (char_length(nome) between 1 and 160),
  telefone       text,
  email          text,
  origem         text,
  stage_id       uuid references public.pipeline_stages(id) on delete set null,
  custom         jsonb not null default '{}'::jsonb,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index contacts_tenant_idx on public.contacts(tenant_id, criado_em desc);
create index contacts_stage_idx  on public.contacts(stage_id);

create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete cascade,
  tipo        text not null,
  descricao   text not null default '',
  quando      timestamptz not null,
  concluida   boolean not null default false,
  criado_por  uuid references auth.users(id) on delete set null default auth.uid(),
  criado_em   timestamptz not null default now()
);
create index activities_tenant_idx  on public.activities(tenant_id, quando);
create index activities_contact_idx on public.activities(contact_id);

-- Registros de entidades específicas do nicho (procedimentos, planos, imóveis…)
create table public.records (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  entidade       text not null,
  titulo         text not null check (char_length(titulo) between 1 and 200),
  custom         jsonb not null default '{}'::jsonb,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index records_tenant_idx on public.records(tenant_id, entidade, criado_em desc);

-- atualizado_em automático
create or replace function private.touch_updated()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger contacts_touch before update on public.contacts
  for each row execute function private.touch_updated();
create trigger records_touch before update on public.records
  for each row execute function private.touch_updated();

-- ---------------------------------------------------------------------------
-- Helpers de autorização
-- ---------------------------------------------------------------------------
create or replace function private.is_member(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = p_tenant and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_admin(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = p_tenant and m.user_id = (select auth.uid())
      and m.papel in ('dono','admin')
  );
$$;

revoke all on function private.is_member(uuid) from public;
revoke all on function private.is_admin(uuid)  from public;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.is_admin(uuid)  to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.segments          enable row level security;
alter table public.tenants           enable row level security;
alter table public.tenant_members    enable row level security;
alter table public.tenant_modules    enable row level security;
alter table public.pipeline_stages   enable row level security;
alter table public.field_definitions enable row level security;
alter table public.contacts          enable row level security;
alter table public.activities        enable row level security;
alter table public.records           enable row level security;

-- Templates: leitura pública (a página de cadastro lista os ramos antes do login)
create policy segments_read on public.segments
  for select to anon, authenticated using (ativo);

-- Tenant: membros leem; dono/admin editam. Criação só pela função create_tenant.
create policy tenants_read on public.tenants
  for select to authenticated using ((select private.is_member(id)));
create policy tenants_update on public.tenants
  for update to authenticated
  using ((select private.is_admin(id))) with check ((select private.is_admin(id)));

create policy members_read on public.tenant_members
  for select to authenticated using ((select private.is_member(tenant_id)));

-- Configuração do ambiente: membros leem, admins alteram
create policy modules_read  on public.tenant_modules
  for select to authenticated using ((select private.is_member(tenant_id)));
create policy modules_write on public.tenant_modules
  for all to authenticated
  using ((select private.is_admin(tenant_id))) with check ((select private.is_admin(tenant_id)));

create policy stages_read  on public.pipeline_stages
  for select to authenticated using ((select private.is_member(tenant_id)));
create policy stages_write on public.pipeline_stages
  for all to authenticated
  using ((select private.is_admin(tenant_id))) with check ((select private.is_admin(tenant_id)));

create policy fields_read  on public.field_definitions
  for select to authenticated using ((select private.is_member(tenant_id)));
create policy fields_write on public.field_definitions
  for all to authenticated
  using ((select private.is_admin(tenant_id))) with check ((select private.is_admin(tenant_id)));

-- Dados: qualquer membro do ambiente
create policy contacts_all on public.contacts
  for all to authenticated
  using ((select private.is_member(tenant_id))) with check ((select private.is_member(tenant_id)));
create policy activities_all on public.activities
  for all to authenticated
  using ((select private.is_member(tenant_id))) with check ((select private.is_member(tenant_id)));
create policy records_all on public.records
  for all to authenticated
  using ((select private.is_member(tenant_id))) with check ((select private.is_member(tenant_id)));

-- ---------------------------------------------------------------------------
-- Provisionamento: cria o ambiente a partir do template do nicho
-- ---------------------------------------------------------------------------
create or replace function public.create_tenant(p_nome text, p_segment text, p_cnpj text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_seg    public.segments%rowtype;
  v_tenant uuid;
begin
  if v_user is null then
    raise exception 'É preciso estar autenticado para criar um ambiente' using errcode = '42501';
  end if;

  -- Um ambiente por usuário nesta versão: devolve o existente em vez de duplicar
  select m.tenant_id into v_tenant
    from public.tenant_members m where m.user_id = v_user limit 1;
  if v_tenant is not null then
    return v_tenant;
  end if;

  select * into v_seg from public.segments where slug = p_segment and ativo;
  if not found then
    raise exception 'Ramo de atuação desconhecido: %', p_segment using errcode = '22023';
  end if;

  insert into public.tenants (nome, cnpj, segment_slug, template_versao, config, criado_por)
  values (
    trim(p_nome),
    nullif(regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g'), ''),
    v_seg.slug,
    v_seg.versao,
    jsonb_build_object(
      'labels',       coalesce(v_seg.config->'labels', '{}'::jsonb),
      'agenda_tipos', coalesce(v_seg.config->'agenda_tipos', '[]'::jsonb),
      'neo',          coalesce(v_seg.config->'neo', '{}'::jsonb)
    ),
    v_user
  )
  returning id into v_tenant;

  insert into public.tenant_members (tenant_id, user_id, papel) values (v_tenant, v_user, 'dono');

  insert into public.tenant_modules (tenant_id, chave, tipo, rotulo, icone, entidade, ordem)
  select v_tenant, m->>'chave', m->>'tipo', m->>'rotulo', coalesce(m->>'icone','circle'), m->>'entidade', o::int
    from jsonb_array_elements(v_seg.config->'modulos') with ordinality as t(m, o);

  insert into public.pipeline_stages (tenant_id, nome, ordem, cor, tipo)
  select v_tenant, e->>'nome', o::int, coalesce(e->>'cor','#8a8f98'), coalesce(e->>'tipo','aberta')
    from jsonb_array_elements(v_seg.config->'etapas') with ordinality as t(e, o);

  insert into public.field_definitions (tenant_id, entidade, chave, rotulo, tipo, opcoes, obrigatorio, ordem)
  select v_tenant, coalesce(c->>'entidade','contato'), c->>'chave', c->>'rotulo', c->>'tipo',
         coalesce(c->'opcoes','[]'::jsonb), coalesce((c->>'obrigatorio')::boolean, false), o::int
    from jsonb_array_elements(v_seg.config->'campos') with ordinality as t(c, o);

  return v_tenant;
end $$;

revoke all on function public.create_tenant(text, text, text) from public, anon;
grant execute on function public.create_tenant(text, text, text) to authenticated;

-- Ambiente completo do usuário logado numa chamada (respeita RLS)
create or replace function public.my_environment()
returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'tenant',  to_jsonb(t) - 'criado_por',
    'segment', jsonb_build_object('slug', s.slug, 'nome', s.nome, 'icone', s.icone),
    'papel',   m.papel,
    'modules', coalesce((select jsonb_agg(to_jsonb(x) order by x.ordem)
                           from public.tenant_modules x where x.tenant_id = t.id and x.ativo), '[]'),
    'stages',  coalesce((select jsonb_agg(to_jsonb(x) order by x.ordem)
                           from public.pipeline_stages x where x.tenant_id = t.id), '[]'),
    'fields',  coalesce((select jsonb_agg(to_jsonb(x) order by x.entidade, x.ordem)
                           from public.field_definitions x where x.tenant_id = t.id), '[]')
  )
  from public.tenant_members m
  join public.tenants t  on t.id = m.tenant_id
  join public.segments s on s.slug = t.segment_slug
  where m.user_id = (select auth.uid())
  order by m.criado_em
  limit 1;
$$;

revoke all on function public.my_environment() from public, anon;
grant execute on function public.my_environment() to authenticated;

-- ---------------------------------------------------------------------------
-- Grants explícitos (o projeto revoga os privilégios padrão de anon/authenticated)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.segments to anon, authenticated;
grant select on public.tenants to authenticated;
grant update (nome, cnpj, config) on public.tenants to authenticated;
grant select on public.tenant_members to authenticated;
grant select, insert, update, delete on
  public.tenant_modules, public.pipeline_stages, public.field_definitions,
  public.contacts, public.activities, public.records
to authenticated;
