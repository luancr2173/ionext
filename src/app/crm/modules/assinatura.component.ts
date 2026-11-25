import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmPlan } from '../core/crm.models';
import { brl } from '../pages/planos.component';
import { whatsappUrl } from '../../core/config/site.config';

type Estado = 'em_teste' | 'teste_acabou' | 'aguardando' | 'atrasado' | 'cancelado' | 'ativo';

/**
 * Plano e assinatura do cliente. Também é a tela que aparece no lugar do CRM quando o
 * teste grátis termina ou o pagamento não foi confirmado (os dados ficam guardados).
 */
@Component({
  selector: 'crm-assinatura',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sub">
      <header class="sub-head">
        <span class="mono">Plano e assinatura</span>
        <h1>{{ title() }}</h1>
        <p class="muted">{{ subtitle() }}</p>
        @if (estado() === 'aguardando' || estado() === 'atrasado') {
          <a class="btn btn-primary" [href]="whatsLink()" target="_blank" rel="noopener">Falar com a IONEXT no WhatsApp</a>
        }
      </header>

      @if (error()) { <p class="alert alert-error" role="alert">{{ error() }}</p> }

      @if (canChoose()) {
        <div class="sub-plans">
          @for (p of plans(); track p.slug) {
            <article class="card sub-plan" [class.is-current]="p.slug === currentSlug()">
              <div class="sub-plan-head">
                <h2>{{ p.nome }}</h2>
                @if (p.slug === currentSlug()) { <span class="pill">{{ chosen() ? 'Escolhido' : 'Plano do cadastro' }}</span> }
              </div>
              <p class="price">
                @if (p.preco_mensal === null) { Sob consulta }
                @else if (p.preco_primeiro_mes !== null) {
                  <strong>{{ fmt(p.preco_primeiro_mes) }}</strong> no 1º mês · depois {{ fmt(p.preco_mensal) }}/mês
                } @else {
                  {{ p.preco_a_partir ? 'a partir de ' : '' }}<strong>{{ fmt(p.preco_mensal) }}</strong>/mês
                  @if (p.taxa_implantacao) { + implantação }
                }
              </p>
              <ul>
                @for (r of p.recursos; track r) { <li>{{ r }}</li> }
              </ul>
              <button class="btn" type="button" [class.btn-primary]="p.slug === currentSlug()"
                [disabled]="busy() || !isOwner()" (click)="choose(p)">
                {{ busy() === p.slug ? 'Salvando…' : buttonLabel(p) }}
              </button>
            </article>
          }
        </div>
        @if (!isOwner()) { <p class="muted small">Só o dono da conta pode escolher o plano.</p> }
      }
    </section>
  `,
  styles: `
    .sub { display: grid; gap: var(--space-xl); }
    .sub-head { display: grid; gap: var(--space-sm); justify-items: start; max-width: 70ch; }
    .sub-head h1 { font-size: clamp(26px, 3.2vw, 36px); }
    .sub-plans { display: grid; gap: var(--space-md); grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .sub-plan { display: grid; gap: var(--space-md); grid-template-rows: auto auto 1fr auto; }
    .sub-plan.is-current { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); }
    .sub-plan-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-sm); }
    .price { font-size: var(--font-size-body-sm); color: var(--fg-muted); }
    .price strong { font-size: 22px; color: var(--fg); }
    ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: var(--font-size-body-sm); }
    .small { font-size: var(--font-size-body-sm); }
  `,
})
export class AssinaturaComponent implements OnInit {
  private readonly envService = inject(CrmEnvironmentService);

  protected readonly plans = signal<CrmPlan[]>([]);
  protected readonly busy = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly fmt = brl;

  private readonly tenant = computed(() => this.envService.env()?.tenant);
  protected readonly currentSlug = computed(() => this.tenant()?.plan_slug ?? 'essencial');
  protected readonly planName = computed(() => this.envService.env()?.plano?.nome ?? '');
  protected readonly chosen = computed(() => !!this.tenant()?.upgrade_requested_at);
  protected readonly isOwner = computed(() => ['dono', 'admin'].includes(this.envService.env()?.papel ?? ''));

  protected readonly estado = computed<Estado>(() => {
    const env = this.envService.env();
    const st = env?.tenant.subscription_status;
    if (st === 'teste') return env?.acesso ? 'em_teste' : 'teste_acabou';
    if (st === 'aguardando_pagamento') return 'aguardando';
    if (st === 'inadimplente') return 'atrasado';
    if (st === 'cancelado') return 'cancelado';
    return 'ativo';
  });

  protected readonly canChoose = computed(() => this.estado() !== 'ativo');

  protected readonly title = computed(() => {
    const dias = this.envService.trialDaysLeft();
    switch (this.estado()) {
      case 'em_teste':
        return dias <= 1 ? 'Seu teste grátis termina hoje' : `Faltam ${dias} dias do seu teste grátis`;
      case 'teste_acabou':
        return 'Seu teste grátis terminou';
      case 'aguardando':
        return `Pedido recebido: plano ${this.planName()}`;
      case 'atrasado':
        return 'Pagamento em atraso';
      case 'cancelado':
        return 'Sua assinatura foi cancelada';
      default:
        return `Plano ${this.planName()} ativo`;
    }
  });

  protected readonly subtitle = computed(() => {
    const end = this.tenant()?.trial_ends_at;
    const data = end ? new Date(end).toLocaleDateString('pt-BR') : '';
    switch (this.estado()) {
      case 'em_teste':
        return this.chosen()
          ? `Você escolheu o plano ${this.planName()}. A IONEXT envia o link de pagamento antes do fim do teste (${data}).`
          : `Use o CRM à vontade até ${data}. Escolha o plano agora para continuar sem interrupção quando o teste acabar.`;
      case 'teste_acabou':
        return 'Seus dados estão guardados. Escolha um plano para continuar usando o CRM.';
      case 'aguardando':
        return 'A IONEXT vai enviar o link de pagamento no seu e-mail. O acesso volta assim que o pagamento for confirmado, com todos os seus dados.';
      case 'atrasado':
        return 'Regularize o pagamento para voltar a usar o CRM. Seus dados estão guardados.';
      case 'cancelado':
        return 'Escolha um plano para reativar o seu CRM. Seus dados estão guardados.';
      default:
        return 'Para trocar de plano, fale com a IONEXT.';
    }
  });

  protected readonly whatsLink = computed(() =>
    whatsappUrl(`Olá! Quero pagar o plano ${this.planName()} do CRM IONEXT (${this.tenant()?.nome ?? ''}).`),
  );

  async ngOnInit(): Promise<void> {
    try {
      this.plans.set(await this.envService.listPlans());
    } catch {
      this.error.set('Não foi possível carregar os planos.');
    }
  }

  protected buttonLabel(p: CrmPlan): string {
    if (p.slug === this.currentSlug() && this.chosen()) return 'Plano escolhido';
    return `Escolher ${p.nome}`;
  }

  protected async choose(p: CrmPlan): Promise<void> {
    if (p.slug === this.currentSlug() && this.chosen()) return;
    this.busy.set(p.slug);
    this.error.set('');
    try {
      await this.envService.choosePlan(p.slug);
    } catch {
      this.error.set('Não foi possível registrar o plano. Tente de novo.');
    } finally {
      this.busy.set(null);
    }
  }
}
