import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'IONEXT — IA e Automação para Todo o Funil de Vendas',
  },
  {
    path: 'servicos',
    loadComponent: () =>
      import('./pages/servicos/servicos.component').then((m) => m.ServicosPageComponent),
    title: 'Serviços — IONEXT',
  },
  {
    path: 'processo',
    loadComponent: () =>
      import('./pages/processo/processo.component').then((m) => m.ProcessoPageComponent),
    title: 'Processo — IONEXT',
  },
  {
    path: 'planos',
    loadComponent: () =>
      import('./pages/planos/planos.component').then((m) => m.PlanosPageComponent),
    title: 'Planos — IONEXT',
  },
  {
    path: 'contato',
    loadComponent: () =>
      import('./pages/contato/contato.component').then((m) => m.ContatoPageComponent),
    title: 'Contato — IONEXT',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
