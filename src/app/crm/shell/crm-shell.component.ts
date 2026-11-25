import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmAdminService } from '../core/crm-admin.service';
import { CrmIconComponent } from '../shared/crm-icon.component';
import { AssinaturaComponent } from '../modules/assinatura.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

/** Estrutura do CRM: o menu lateral é montado com os módulos do nicho do cliente. */
@Component({
  selector: 'crm-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CrmIconComponent, ThemeToggleComponent, AssinaturaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../crm-ui.scss', './crm-shell.component.scss'],
  template: `
    <div class="crm crm-shell" data-lenis-prevent [class.nav-open]="navOpen()">
      <aside class="crm-side" aria-label="Menu do CRM">
        <div class="side-brand">
          <span class="mono">IONEXT · CRM</span>
          <strong class="side-tenant">{{ env.env()?.tenant?.nome }}</strong>
          <span class="pill"><crm-icon [name]="env.env()?.segment?.icone ?? 'briefcase'" [size]="14" />
            {{ env.env()?.segment?.nome }}</span>
        </div>

        <nav class="side-nav">
          @for (m of env.modules(); track m.id) {
            <a [routerLink]="['/crm', m.chave]" routerLinkActive="is-active" (click)="navOpen.set(false)">
              <crm-icon [name]="m.icone" [size]="18" /> {{ m.rotulo }}
            </a>
          }
        </nav>

        <a class="side-admin side-plan" routerLink="/crm/assinatura" routerLinkActive="is-active" (click)="navOpen.set(false)">
          <crm-icon name="list" [size]="16" /> Plano e assinatura
        </a>
                @if (isAdmin()) {
          <a class="side-admin" routerLink="/crm/admin"><crm-icon name="grid" [size]="16" /> Painel IONEXT</a>
        }
        <button class="btn btn-ghost btn-sm side-logout" type="button" (click)="logout()">
          <crm-icon name="logout" [size]="16" /> Sair
        </button>
      </aside>

      <button class="side-scrim" type="button" aria-label="Fechar menu" (click)="navOpen.set(false)"></button>

      <div class="crm-main">
        <header class="crm-topbar">
          <button class="btn btn-ghost btn-sm menu-btn" type="button" aria-label="Abrir menu" (click)="navOpen.set(true)">
            <crm-icon name="menu" />
          </button>
          <span class="muted topbar-user">{{ sb.session()?.user?.email }}</span>
          <app-theme-toggle />
        </header>
        <main class="crm-content">
          @if (env.env()?.acesso === false) {
            <!-- teste acabou ou pagamento pendente: os dados ficam guardados, o CRM pede o plano -->
            <crm-assinatura />
          } @else {
            @if (billingNotice(); as n) {
              <div class="billing-notice" [class.is-warning]="n.warning" role="status">
                <strong>{{ n.title }}</strong>
                <span>{{ n.text }}</span>
                @if (n.cta) { <a routerLink="/crm/assinatura">{{ n.cta }}</a> }
              </div>
            }
            <router-outlet />
          }
        </main>
      </div>
    </div>
  `,
})
export class CrmShellComponent implements OnInit {
  protected readonly env = inject(CrmEnvironmentService);
  protected readonly sb = inject(SupabaseService);
  private readonly router = inject(Router);
  protected readonly navOpen = signal(false);
  protected readonly isAdmin = signal(false);

  /** Aviso de assinatura (cobrança ainda manual: a IONEXT envia o link de pagamento). */
  protected readonly billingNotice = computed(() => {
    const env = this.env.env();
    if (!env || !env.acesso) return null;
    const plano = env.plano?.nome ?? '';
    if (env.tenant.subscription_status === 'teste') {
      const dias = this.env.trialDaysLeft();
      const quando = dias <= 1 ? 'termina hoje' : `faltam ${dias} dias`;
      return env.tenant.upgrade_requested_at
        ? {
            warning: false,
            title: `Teste grátis: ${quando}.`,
            text: `Plano ${plano} escolhido. A IONEXT envia o link de pagamento antes do fim do teste.`,
            cta: '',
          }
        : {
            warning: dias <= 2,
            title: `Teste grátis: ${quando}.`,
            text: 'Escolha o plano para continuar sem interrupção quando o teste acabar.',
            cta: 'Escolher plano',
          };
    }
    return null;
  });
  private readonly admin = inject(CrmAdminService);

  async ngOnInit(): Promise<void> {
    this.isAdmin.set(await this.admin.isAdmin());
  }

  protected async logout(): Promise<void> {
    await this.sb.client.auth.signOut();
    this.env.clear();
    await this.router.navigateByUrl('/crm/entrar');
  }
}
