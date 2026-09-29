import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle-btn"
      [class.show-label]="showLabel()"
      aria-label="Alternar tema"
      [attr.aria-pressed]="themeService.theme() === 'dark'"
      (click)="themeService.toggle($event)"
    >
      <span class="icon-stage" aria-hidden="true">
        <!-- Sun Icon (active in dark mode to switch to light) -->
        <svg
          class="theme-icon icon-sun"
          [class.is-active]="themeService.theme() === 'dark'"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>

        <!-- Moon Icon (active in light mode to switch to dark) -->
        <svg
          class="theme-icon icon-moon"
          [class.is-active]="themeService.theme() === 'light'"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
      @if (showLabel()) {
        <span class="toggle-label">
          {{ themeService.theme() === 'dark' ? 'Modo Claro' : 'Modo Escuro' }}
        </span>
      }
    </button>
  `,
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);

  readonly showLabel = input<boolean>(false);
}
