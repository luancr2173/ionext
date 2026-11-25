import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { crmAdminGuard, crmAuthGuard, crmGuestGuard } from './core/crm.guards';
import { CrmEnvironmentService } from './core/crm-environment.service';

/** /crm abre o primeiro módulo do nicho do cliente (normalmente o painel). */
const firstModule = () => `/crm/${inject(CrmEnvironmentService).modules()[0]?.chave ?? 'painel'}`;

export const CRM_ROUTES: Routes = [
  {
    path: 'entrar',
    canActivate: [crmGuestGuard],
    loadComponent: () => import('./pages/entrar.component').then((m) => m.EntrarComponent),
    title: 'Entrar — IONEXT CRM',
    data: { description: 'Acesse o CRM da IONEXT.', noindex: true },
  },
  {
    path: 'planos',
    loadComponent: () => import('./pages/planos.component').then((m) => m.PlanosComponent),
    title: 'Planos do CRM IONEXT — Essencial, Profissional e Enterprise',
    data: {
      description: 'CRM pronto para o seu ramo: Essencial com 1º mês por R$ 10, Profissional e Enterprise com agente de IA no WhatsApp.',
    },
  },
  {
    path: 'cadastro',
    canActivate: [crmGuestGuard],
    loadComponent: () => import('./pages/cadastro.component').then((m) => m.CadastroComponent),
    title: 'Crie o CRM do seu negócio — IONEXT',
    data: {
      description: 'Cadastre sua empresa e receba um CRM pronto para o seu ramo: clínicas, academias, imobiliárias e mais.',
      noindex: true,
    },
  },
  {
    path: 'admin',
    canActivate: [crmAdminGuard],
    loadComponent: () => import('./admin/admin.component').then((m) => m.AdminComponent),
    title: 'Painel IONEXT — ambientes de clientes',
    data: { description: 'Painel da plataforma IONEXT', noindex: true },
  },
  {
    path: '',
    canActivate: [crmAuthGuard],
    loadComponent: () => import('./shell/crm-shell.component').then((m) => m.CrmShellComponent),
    data: { description: 'CRM IONEXT', noindex: true },
    children: [
      { path: '', pathMatch: 'full', redirectTo: firstModule },
      {
        path: 'assinatura',
        loadComponent: () => import('./modules/assinatura.component').then((m) => m.AssinaturaComponent),
        title: 'Plano e assinatura — CRM IONEXT',
      },
      {
        path: ':modulo',
        loadComponent: () => import('./shell/module-host.component').then((m) => m.ModuleHostComponent),
        title: 'CRM — IONEXT',
      },
    ],
  },
];
