-- Índices das FKs e políticas de escrita separadas por ação (evita duas políticas no SELECT)
create index if not exists activities_criado_por_idx on public.activities(criado_por);
create index if not exists tenants_criado_por_idx    on public.tenants(criado_por);
create index if not exists tenants_segment_idx       on public.tenants(segment_slug);

drop policy modules_write on public.tenant_modules;
create policy modules_insert on public.tenant_modules for insert to authenticated with check ((select private.is_admin(tenant_id)));
create policy modules_update on public.tenant_modules for update to authenticated using ((select private.is_admin(tenant_id))) with check ((select private.is_admin(tenant_id)));
create policy modules_delete on public.tenant_modules for delete to authenticated using ((select private.is_admin(tenant_id)));

drop policy stages_write on public.pipeline_stages;
create policy stages_insert on public.pipeline_stages for insert to authenticated with check ((select private.is_admin(tenant_id)));
create policy stages_update on public.pipeline_stages for update to authenticated using ((select private.is_admin(tenant_id))) with check ((select private.is_admin(tenant_id)));
create policy stages_delete on public.pipeline_stages for delete to authenticated using ((select private.is_admin(tenant_id)));

drop policy fields_write on public.field_definitions;
create policy fields_insert on public.field_definitions for insert to authenticated with check ((select private.is_admin(tenant_id)));
create policy fields_update on public.field_definitions for update to authenticated using ((select private.is_admin(tenant_id))) with check ((select private.is_admin(tenant_id)));
create policy fields_delete on public.field_definitions for delete to authenticated using ((select private.is_admin(tenant_id)));
