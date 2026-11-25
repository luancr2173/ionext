import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmPlan } from '../core/crm.models';
import { Crm3dIconComponent } from '../shared/crm-3d-icon.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

export function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: value % 1 ? 2 : 0 });
}

/** Planos do CRM IONEXT: preços vêm da tabela crm_plans (dá para mudar sem publicar o site). */
@Component({
  selector: 'crm-planos',
  imports: [RouterLink, Crm3dIconComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../crm-ui.scss', './auth-pages.scss', './planos.component.scss'],
  template: `
    <div class="crm crm-auth auth-center" data-lenis-prevent>
      <a routerLink="/" class="auth-brand auth-brand-corner mono">IONEXT · CRM</a>
      <div class="auth-theme-corner"><app-theme-toggle /></div>

      <main class="auth-panel plans-panel">
        <header class="auth-head auth-head-center">
          <crm-3d-icon [size]="132" />
          <h1>Escolha o plano do seu <span class="em">CRM</span></h1>
          <p class="muted">CRM pronto para o seu ramo de atuação: funil, agenda e cadastros do seu negócio desde o primeiro dia. Teste grátis por 7 dias em qualquer plano, sem cartão.</p>
        </header>

        @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

        <section class="plan-grid" aria-label="Planos">
          @for (p of plans(); track p.slug) {
            <article class="plan-card" [class.is-featured]="p.destaque">
              @if (p.preco_primeiro_mes !== null) {
                <span class="plan-badge">1º mês por {{ fmt(p.preco_primeiro_mes) }}</span>
              }
              <header class="plan-head">
                <h2>{{ p.nome }}</h2>
                <p class="muted">{{ p.descricao }}</p>
              </header>

              <div class="plan-price">
                @if (p.preco_mensal === null) {
                  <strong>Sob consulta</strong>
                } @else if (p.preco_primeiro_mes !== null) {
                  <strong>{{ fmt(p.preco_primeiro_mes) }}</strong><span class="per">no 1º mês</span>
                  <span class="then muted">depois {{ fmt(p.preco_mensal) }}/mês</span>
                } @else {
                  @if (p.preco_a_partir) { <span class="from muted">a partir de</span> }
                  <strong>{{ fmt(p.preco_mensal) }}</strong><span class="per">/mês</span>
                  @if (p.taxa_implantacao) { <span class="then muted">+ implantação do agente</span> }
                }
              </div>

              <ul class="plan-features">
                @for (r of p.recursos; track r) {
                  <li><span class="tick" aria-hidden="true"></span>{{ r }}</li>
                }
              </ul>

              <a class="btn plan-cta" [class.btn-primary]="p.destaque" [routerLink]="['/crm/cadastro']" [queryParams]="{ plano: p.slug }">
                {{ ctaLabel(p) }}
              </a>
            </article>
          } @empty {
            @if (!error()) { <p class="muted">Carregando planos…</p> }
          }
        </section>

        <p class="muted plans-note">
          7 dias grátis para testar. Depois, você escolhe o plano para continuar. Valores em reais, cobrança mensal. Já tem conta? <a routerLink="/crm/entrar">Entrar no CRM</a>
        </p>
      </main>
    </div>
  `,
})
export class PlanosComponent implements OnInit {
  private readonly envService = inject(CrmEnvironmentService);
  protected readonly plans = signal<CrmPlan[]>([]);
  protected readonly error = signal('');
  protected readonly fmt = brl;

  async ngOnInit(): Promise<void> {
    try {
      this.plans.set(await this.envService.listPlans());
    } catch {
      this.error.set('Não foi possível carregar os planos agora. Tente recarregar a página.');
    }
  }

  protected ctaLabel(_p: CrmPlan): string {
    return 'Testar 7 dias grátis';
  }

}
