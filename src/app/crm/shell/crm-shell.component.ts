import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmAdminService } from '../core/crm-admin.service';
import { CrmIconComponent } from '../shared/crm-icon.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

/** Estrutura do CRM: o menu lateral é montado com os módulos do nicho do cliente. */
@Component({
  selector: 'crm-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CrmIconComponent, ThemeToggleComponent],
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
          <router-outlet />
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
