import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="scroll-to-top-btn"
      [class.is-visible]="isVisible()"
      [attr.tabindex]="isVisible() ? 0 : -1"
      [attr.aria-hidden]="!isVisible()"
      aria-label="Voltar ao topo da página"
      title="Voltar ao topo"
      (click)="onClick($event)"
    >
      <span class="icon-wrap" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </span>
    </button>
  `,
  styleUrl: './scroll-to-top.component.scss',
})
export class ScrollToTopComponent {
  private readonly scrollService = inject(ScrollService);

  /**
   * Visible when scrolled down past 400px (beyond the hero fold).
   */
  protected readonly isVisible = computed(() => this.scrollService.scrollY() > 400);

  protected onClick(event: MouseEvent): void {
    event.preventDefault();
    this.scrollService.scrollToTop();
  }
}
