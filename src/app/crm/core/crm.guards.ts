import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { CrmEnvironmentService } from './crm-environment.service';
import { CrmAdminService } from './crm-admin.service';

// Importante: todo inject() acontece antes do primeiro await (fora disso não há contexto de injeção).

/** Exige sessão e ambiente; sem ambiente, manda escolher o ramo. */
export const crmAuthGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const sb = inject(SupabaseService);
  const envService = inject(CrmEnvironmentService);
  const admin = inject(CrmAdminService);

  const session = await sb.currentSession();
  if (!session) return router.createUrlTree(['/crm/entrar']);

  try {
    const env = await envService.load();
    if (env) return true;
    // equipe IONEXT sem CRM próprio vai direto para o painel da plataforma
    if (await admin.isAdmin()) return router.createUrlTree(['/crm/admin']);
    return router.createUrlTree(['/crm/cadastro'], { queryParams: { etapa: 'ramo' } });
  } catch {
    return router.createUrlTree(['/crm/entrar'], { queryParams: { erro: 'ambiente' } });
  }
};

/** Usuário já logado com ambiente não precisa ver entrar/cadastro. */
export const crmGuestGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const sb = inject(SupabaseService);
  const envService = inject(CrmEnvironmentService);

  const session = await sb.currentSession();
  if (!session) return true;
  if (route.queryParamMap.get('etapa') === 'ramo') return true;
  try {
    const env = await envService.load();
    return env ? router.createUrlTree(['/crm']) : true;
  } catch {
    return true;
  }
};

/** Painel IONEXT: só administradores da plataforma (conferido também no banco). */
export const crmAdminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const sb = inject(SupabaseService);
  const admin = inject(CrmAdminService);

  const session = await sb.currentSession();
  if (!session) return router.createUrlTree(['/crm/entrar']);
  return (await admin.isAdmin()) ? true : router.createUrlTree(['/crm']);
};
