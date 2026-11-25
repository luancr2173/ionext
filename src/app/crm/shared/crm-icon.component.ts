import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Ícones simples em linha (stroke) usados no menu e nos cartões de ramo. */
const PATHS: Record<string, string> = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.87M15.5 3.13a3.5 3.5 0 0 1 0 6.75',
  columns: 'M4 4h4v16H4zM10 4h4v11h-4zM16 4h4v7h-4z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  tooth: 'M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 8 .4 2.6 1 5.5 2.5 5.5S9 18 10 15.5c.5-1.2 1.5-1.2 2 0 1 2.5 1.5 5.5 3 5.5s2.1-2.9 2.5-5.5c.5-3.5 2-5 2-8C19.5 5 18 3 15.5 3c-1.7 0-2.5 1-3.5 1S8.7 3 7 3',
  dumbbell: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
};

@Component({
  selector: 'crm-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path [attr.d]="d()" pathLength="1" />
    </svg>
  `,
  styles: `:host { display: inline-flex; flex-shrink: 0; }`,
})
export class CrmIconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
  protected readonly d = computed(() => PATHS[this.name()] ?? PATHS['circle']);
}
