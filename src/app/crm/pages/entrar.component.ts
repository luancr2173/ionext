import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmAdminService } from '../core/crm-admin.service';
import { translateAuthError } from './cadastro.component';
import { Crm3dIconComponent } from '../shared/crm-3d-icon.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'crm-entrar',
  imports: [FormsModule, RouterLink, Crm3dIconComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../crm-ui.scss', './auth-pages.scss'],
  template: `
    <div class="crm crm-auth auth-center" data-lenis-prevent>
      <a routerLink="/" class="auth-brand auth-brand-corner mono">IONEXT · CRM</a>
      <div class="auth-theme-corner"><app-theme-toggle /></div>

      <main class="auth-panel">
        <header class="auth-head auth-head-center">
          <crm-3d-icon [size]="168" />
          <h1>Entrar no <span class="em">CRM</span></h1>
          <p class="muted">Seus clientes, o funil e o agente de IA num só lugar.</p>
        </header>

        <form class="auth-form auth-form-tight" (ngSubmit)="submit()" #f="ngForm">
          <label class="field">
            <span>E-mail</span>
            <input class="input" type="email" name="email" [(ngModel)]="email" required email autocomplete="email" placeholder="voce@empresa.com.br" />
          </label>
          <label class="field">
            <span>Senha</span>
            <input class="input" type="password" name="senha" [(ngModel)]="senha" required autocomplete="current-password" />
          </label>

          @if (error()) { <p class="alert alert-error" role="alert">{{ error() }}</p> }

          <button class="btn btn-primary btn-block" type="submit" [disabled]="busy() || f.invalid">
            {{ busy() ? 'Entrando…' : 'Entrar' }}
          </button>
          <p class="muted auth-switch">Ainda não tem conta? <a routerLink="/crm/planos">Ver planos</a></p>
        </form>
      </main>
    </div>
  `,
})
export class EntrarComponent {
  private readonly sb = inject(SupabaseService);
  private readonly envService = inject(CrmEnvironmentService);
  private readonly admin = inject(CrmAdminService);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly error = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('erro') === 'ambiente'
      ? 'Não conseguimos carregar o seu ambiente. Entre novamente.'
      : '',
  );
  protected email = '';
  protected senha = '';

  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const { error } = await this.sb.client.auth.signInWithPassword({ email: this.email.trim(), password: this.senha });
      if (error) throw error;
      const env = await this.envService.load(true);
      if (env) await this.router.navigateByUrl('/crm');
      else if (await this.admin.isAdmin()) await this.router.navigateByUrl('/crm/admin');
      else await this.router.navigateByUrl('/crm/cadastro?etapa=ramo');
    } catch (e) {
      this.error.set(translateAuthError(e));
    } finally {
      this.busy.set(false);
    }
  }
}
