import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Funil desenhado em SVG — aparece no lugar da cena 3D quando não há WebGL. */
@Component({
  selector: 'app-funnel-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 400 420" fill="none" aria-hidden="true">
      @for (r of rings; track $index) {
        <ellipse
          cx="200"
          [attr.cy]="r.y"
          [attr.rx]="r.rx"
          [attr.ry]="r.rx * 0.22"
          stroke="currentColor"
          [attr.stroke-opacity]="0.14 + $index * 0.05"
        />
      }
      <circle cx="200" cy="356" r="10" fill="var(--accent)" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      color: var(--fg);
    }
    svg {
      width: 100%;
      height: auto;
    }
  `,
})
export class FunnelFallbackComponent {
  protected readonly rings = Array.from({ length: 8 }, (_, i) => {
    const ft = i / 7;
    return { y: 40 + Math.pow(ft, 0.8) * 290, rx: 14 + 170 * Math.pow(1 - ft, 2.2) };
  });
}
