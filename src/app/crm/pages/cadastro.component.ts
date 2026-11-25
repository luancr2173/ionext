import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmPlan, Segment } from '../core/crm.models';
import { brl } from './planos.component';
import { CrmIconComponent } from '../shared/crm-icon.component';
import { Crm3dIconComponent } from '../shared/crm-3d-icon.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

/**
 * Cadastro do cliente: escolhe o ramo de atuação e cria a conta.
 * O ramo decide qual template de CRM será copiado para o ambiente dele.
 */
@Component({
  selector: 'crm-cadastro',
  imports: [FormsModule, RouterLink, CrmIconComponent, Crm3dIconComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../crm-ui.scss', './auth-pages.scss'],
  template: `
    <div class="crm crm-auth auth-center" data-lenis-prevent>
      <a routerLink="/" class="auth-brand auth-brand-corner mono">IONEXT · CRM</a>
      <div class="auth-theme-corner"><app-theme-toggle /></div>

      <main class="auth-panel auth-panel-wide">
        <header class="auth-head auth-head-center">
          <crm-3d-icon [size]="148" />
          <h1>Crie o CRM do seu <span class="em">negócio</span></h1>
          <p class="muted">Escolha o ramo de atuação: o CRM já vem com o funil, os campos e os módulos certos para ele.</p>
        </header>

        @if (done()) {
          <div class="card auth-done auth-done-center">
            <h2>Confirme seu e-mail</h2>
            <p class="muted">Enviamos um link para <strong>{{ email }}</strong>. Depois de confirmar, entre e o seu CRM de
              {{ selectedName() }} será criado automaticamente no plano {{ selectedPlan()?.nome }},
              com 7 dias de teste grátis. Antes do fim do teste, você escolhe se quer continuar.</p>
            <a class="btn btn-primary" routerLink="/crm/entrar">Ir para o login</a>
          </div>
        } @else {
          <form class="auth-form auth-form-steps" (ngSubmit)="submit()" #f="ngForm">
            <fieldset class="plans-pick" [disabled]="busy()">
              <legend class="mono">1 · Plano <span class="legend-note">7 dias grátis em qualquer plano</span> <a routerLink="/crm/planos" class="legend-link">comparar planos</a></legend>
              <div class="plan-pills" role="radiogroup" aria-label="Plano">
                @for (p of plans(); track p.slug) {
                  <label class="plan-pill" [class.is-selected]="plano === p.slug">
                    <input type="radio" name="plano" [value]="p.slug" [(ngModel)]="plano" required />
                    <span class="pill-name">{{ p.nome }}</span>
                    <span class="pill-price muted">{{ priceLabel(p) }}</span>
                  </label>
                }
              </div>
            </fieldset>

            <fieldset class="segments" [disabled]="busy()">
              <legend class="mono">2 · Ramo de atuação</legend>
              @if (segmentsError()) {
                <p class="alert alert-error">{{ segmentsError() }}</p>
              }
              <div class="segment-grid" role="radiogroup" aria-label="Ramo de atuação">
                @for (s of segments(); track s.slug) {
                  <label class="segment-card" [class.is-selected]="segmento === s.slug">
                    <input type="radio" name="segmento" [value]="s.slug" [(ngModel)]="segmento" required />
                    <span class="seg-icon" [attr.data-icon]="s.icone"><crm-icon [name]="s.icone" [size]="26" /></span>
                    <span class="segment-name">{{ s.nome }}</span>
                    <span class="segment-desc muted">{{ s.descricao }}</span>
                  </label>
                } @empty {
                  @if (!segmentsError()) { <p class="muted">Carregando ramos…</p> }
                }
              </div>
            </fieldset>

            <fieldset class="form-grid" [disabled]="busy()">
              <legend class="mono span-all">3 · Sua empresa</legend>
              <label class="field">
                <span>Nome da empresa <b class="req">*</b></span>
                <input class="input" name="empresa" [(ngModel)]="empresa" required minlength="2" maxlength="120" autocomplete="organization" />
              </label>
              <label class="field">
                <span>CNPJ (opcional)</span>
                <input class="input" name="cnpj" [(ngModel)]="cnpj" inputmode="numeric" maxlength="18" placeholder="00.000.000/0000-00" />
              </label>
            </fieldset>

            @if (!loggedIn()) {
              <fieldset class="form-grid" [disabled]="busy()">
                <legend class="mono span-all">4 · Seu acesso</legend>
                <label class="field">
                  <span>Seu nome <b class="req">*</b></span>
                  <input class="input" name="nome" [(ngModel)]="nome" required autocomplete="name" />
                </label>
                <label class="field">
                  <span>E-mail <b class="req">*</b></span>
                  <input class="input" type="email" name="email" [(ngModel)]="email" required email autocomplete="email" />
                </label>
                <label class="field span-all">
                  <span>Senha (mínimo 8 caracteres) <b class="req">*</b></span>
                  <input class="input" type="password" name="senha" [(ngModel)]="senha" required minlength="8" autocomplete="new-password" />
                </label>
              </fieldset>
            }

            @if (error()) { <p class="alert alert-error" role="alert">{{ error() }}</p> }

            <div class="auth-actions auth-actions-center">
              <button class="btn btn-primary btn-wide" type="submit" [disabled]="busy() || f.invalid">
                {{ busy() ? 'Criando seu CRM…' : 'Começar teste grátis de 7 dias' }}
              </button>
              @if (!loggedIn()) {
                <p class="muted auth-switch">Já tem conta? <a routerLink="/crm/entrar">Entrar</a></p>
              }
            </div>
          </form>
        }
      </main>
    </div>
  `,
})
export class CadastroComponent implements OnInit {
  private readonly sb = inject(SupabaseService);
  private readonly envService = inject(CrmEnvironmentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly segments = signal<Segment[]>([]);
  protected readonly segmentsError = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly done = signal(false);
  protected readonly loggedIn = signal(false);

  protected readonly plans = signal<CrmPlan[]>([]);
  protected plano = 'essencial';
  protected segmento = '';
  protected empresa = '';
  protected cnpj = '';
  protected nome = '';
  protected email = '';
  protected senha = '';

  async ngOnInit(): Promise<void> {
    this.loggedIn.set(!!(await this.sb.currentSession()));
    const ramo = this.route.snapshot.queryParamMap.get('ramo');
    const plano = this.route.snapshot.queryParamMap.get('plano');
    this.envService
      .listPlans()
      .then((list) => {
        this.plans.set(list);
        if (plano && list.some((p) => p.slug === plano)) this.plano = plano;
      })
      .catch(() => this.plans.set([]));
    try {
      const list = await this.envService.listSegments();
      this.segments.set(list);
      if (ramo && list.some((s) => s.slug === ramo)) this.segmento = ramo;
    } catch {
      this.segmentsError.set('Não foi possível carregar os ramos de atuação. Tente recarregar a página.');
    }
  }

  protected selectedPlan(): CrmPlan | undefined {
    return this.plans().find((p) => p.slug === this.plano);
  }

  protected priceLabel(p: CrmPlan): string {
    if (p.preco_mensal === null) return 'sob consulta';
    if (p.preco_primeiro_mes !== null) return `${brl(p.preco_primeiro_mes)} no 1º mês, depois ${brl(p.preco_mensal)}/mês`;
    return `${p.preco_a_partir ? 'a partir de ' : ''}${brl(p.preco_mensal)}/mês`;
  }

  protected selectedName(): string {
    return this.segments().find((s) => s.slug === this.segmento)?.nome ?? '';
  }

  protected async submit(): Promise<void> {
    if (!this.segmento) {
      this.error.set('Escolha o ramo de atuação.');
      return;
    }
    const cnpjDigits = this.cnpj.replace(/\D/g, '');
    if (cnpjDigits && cnpjDigits.length !== 14) {
      this.error.set('O CNPJ precisa ter 14 dígitos (ou deixe em branco).');
      return;
    }

    this.busy.set(true);
    this.error.set('');
    try {
      if (this.loggedIn()) {
        await this.envService.createTenant(this.empresa, this.segmento, cnpjDigits, this.plano);
        await this.router.navigateByUrl('/crm');
        return;
      }

      const { data, error } = await this.sb.client.auth.signUp({
        email: this.email.trim(),
        password: this.senha,
        options: {
          emailRedirectTo: `${location.origin}/crm`,
          data: { nome: this.nome.trim(), empresa: this.empresa.trim(), segmento: this.segmento, cnpj: cnpjDigits || null, plano: this.plano },
        },
      });
      if (error) throw error;

      if (data.session) {
        // Confirmação de e-mail desligada: já cria o ambiente
        await this.envService.createTenant(this.empresa, this.segmento, cnpjDigits, this.plano);
        await this.router.navigateByUrl('/crm');
      } else {
        this.done.set(true);
      }
    } catch (e) {
      this.error.set(translateAuthError(e));
    } finally {
      this.busy.set(false);
    }
  }
}

export function translateAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  if (/already registered|already exists/i.test(msg)) return 'Este e-mail já tem cadastro. Entre com sua senha.';
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/password/i.test(msg) && /characters|weak/i.test(msg)) return 'Senha fraca: use pelo menos 8 caracteres.';
  if (/rate limit/i.test(msg)) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.';
  return 'Não foi possível concluir agora. Tente novamente em instantes.';
}
