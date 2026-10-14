import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (routerLink() || href()) {
      @if (isInternalRoute()) {
        <a
          [routerLink]="routerLink() || href()"
          [class]="buttonClasses()"
          [attr.aria-label]="ariaLabel() || null"
          (click)="handleClick($event)"
        >
          <span class="button-label">
            @if (label()) {
              {{ label() }}
            } @else {
              <ng-content></ng-content>
            }
          </span>
          @if (withArrow()) {
            <span class="button-arrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          }
        </a>
      } @else {
        <a
          [href]="href()"
          [class]="buttonClasses()"
          [attr.aria-label]="ariaLabel() || null"
          (click)="handleClick($event)"
        >
          <span class="button-label">
            @if (label()) {
              {{ label() }}
            } @else {
              <ng-content></ng-content>
            }
          </span>
          @if (withArrow()) {
            <span class="button-arrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          }
        </a>
      }
    } @else {
      <button
        [type]="type()"
        [class]="buttonClasses()"
        [disabled]="disabled() || loading()"
        [attr.aria-label]="ariaLabel() || null"
        (click)="handleClick($event)"
      >
        @if (loading()) {
          <span class="button-spinner" aria-hidden="true"></span>
        }
        <span class="button-label">
          @if (label()) {
            {{ label() }}
          } @else {
            <ng-content></ng-content>
          }
        </span>
        @if (withArrow() && !loading()) {
          <span class="button-arrow" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        }
      </button>
    }
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly label = input<string>('');
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly href = input<string | undefined>(undefined);
  readonly routerLink = input<string | any[] | undefined>(undefined);
  readonly withArrow = input<boolean>(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly clicked = output<MouseEvent>();

  protected readonly isInternalRoute = computed(() => {
    if (this.routerLink()) return true;
    const targetHref = this.href();
    if (!targetHref) return false;
    return targetHref.startsWith('/') && !targetHref.startsWith('//');
  });

  protected readonly buttonClasses = computed(() => {
    return [
      'app-button',
      `btn-${this.variant()}`,
      `btn-${this.size()}`,
      this.withArrow() ? 'has-arrow' : '',
      this.loading() ? 'is-loading' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      return;
    }
    this.clicked.emit(event);
  }
}
