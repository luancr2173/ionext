import { Routes } from '@angular/router';

/**
 * SEO por página: `title` (até 60 caracteres) e `data.description` (até 155), com o
 * serviço e a cidade. O SeoService aplica a descrição, o canonical e as tags de Open
 * Graph/Twitter a cada navegação. O título e a descrição da home precisam bater com o
 * index.html (é o que o Google e as redes leem antes do Angular rodar).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'IONEXT — Agentes de IA para vendas e atendimento',
    data: {
      description:
        'Agência de IA em Brasília: agentes que respondem no WhatsApp em segundos, qualificam clientes e agendam reuniões 24/7. Peça um diagnóstico gratuito.',
    },
  },
  {
    path: 'servicos',
    loadComponent: () =>
      import('./pages/servicos/servicos.component').then((m) => m.ServicosPageComponent),
    title: 'Serviços de IA para vendas e atendimento — IONEXT',
    data: {
      description:
        'Atendimento, agendamento, follow-up, dashboards e sites com IA no WhatsApp: produtos com preço fechado e projetos sob medida. IONEXT, Brasília.',
    },
  },
  {
    path: 'processo',
    loadComponent: () =>
      import('./pages/processo/processo.component').then((m) => m.ProcessoPageComponent),
    title: 'Como implantamos IA no seu funil — IONEXT',
    data: {
      description:
        'Diagnóstico, implementação e operação: como a IONEXT coloca agentes de IA no seu funil de vendas em três fases, com entregas claras. Brasília — DF.',
    },
  },
  {
    path: 'planos',
    loadComponent: () =>
      import('./pages/planos/planos.component').then((m) => m.PlanosPageComponent),
    title: 'Planos de agentes de IA para empresas — IONEXT',
    data: {
      description:
        'Planos Essencial, Profissional e Enterprise para colocar agentes de IA no WhatsApp da sua empresa, do primeiro produto ao projeto sob medida.',
    },
  },
  {
    path: 'portfolio',
    loadComponent: () =>
      import('./pages/portfolio/portfolio.component').then((m) => m.PortfolioPageComponent),
    title: 'Portfólio de sites para negócios locais — IONEXT',
    data: {
      description:
        'Modelos de sites para clínicas, barbearias, salões, restaurantes, celulares e assistência técnica, com 3D e WhatsApp em cada botão. Feitos pela IONEXT, Brasília.',
    },
  },
  {
    path: 'contato',
    loadComponent: () =>
      import('./pages/contato/contato.component').then((m) => m.ContatoPageComponent),
    title: 'Contato e diagnóstico gratuito do funil — IONEXT',
    data: {
      description:
        'Fale com a IONEXT pelo WhatsApp ou pelo formulário e receba em até 24h um diagnóstico gratuito do seu funil de vendas. Agência de IA em Brasília.',
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Página não encontrada — IONEXT',
    data: {
      description: 'O endereço que você procurou não existe mais. Volte ao início da IONEXT ou fale com a gente pelo WhatsApp.',
      noindex: true,
    },
  },
];
