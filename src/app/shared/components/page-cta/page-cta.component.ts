import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { whatsappUrl } from '../../../core/config/site.config';

/** Faixa final das páginas internas: título gigante + WhatsApp com mensagem do contexto. */
@Component({
  selector: 'app-page-cta',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-cta" aria-labelledby="page-cta-title">
      <div class="container">
        <p class="mono-label page-cta-label">Próximo passo</p>
        <h2 class="page-cta-title" id="page-cta-title">
          {{ lead() }}&ngsp;<span class="serif-em">{{ em() }}</span>
        </h2>
        <div class="page-cta-bottom">
          <p class="page-cta-text">{{ text() }}</p>
          <div class="page-cta-actions">
            <a class="pc-btn pc-btn--solid" [href]="href()" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
                <path d="M16 3.2a12.3 12.3 0 0 0-10.5 18.7L4 27.9l6.2-1.6A12.3 12.3 0 1 0 16 3.2Zm0 22.3c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.7 1 1-3.6-.3-.4a10 10 0 1 1 8.8 4.8Zm5.5-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z" />
              </svg>
              <span>{{ cta() }}</span>
            </a>
            @if (secondaryLabel() && secondaryLink()) {
              <a class="pc-btn pc-btn--ghost" [routerLink]="secondaryLink()">{{ secondaryLabel() }}</a>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .page-cta {
      position: relative;
      padding: clamp(96px, 12vw, 176px) 0 clamp(72px, 9vw, 120px);
      background: var(--bg-alt);
      overflow: clip;
      border-top: 1px solid var(--line);

      &::before {
        content: '';
        position: absolute;
        left: 50%;
        bottom: -45%;
        width: 110vw;
        height: 80%;
        transform: translateX(-50%);
        background: radial-gradient(closest-side, var(--accent-glow), transparent);
        opacity: 0.5;
        pointer-events: none;
      }

      .container {
        position: relative;
      }
    }

    .page-cta-label {
      color: var(--accent);
      margin-bottom: 12px;
    }

    .page-cta-title {
      font-family: var(--font-display);
      font-size: clamp(2.6rem, 7.4vw, 7.8rem);
      font-weight: 800;
      font-stretch: 112%;
      letter-spacing: -0.05em;
      line-height: 0.9;
      max-width: 14ch;
      margin-bottom: clamp(32px, 4vw, 56px);
      text-wrap: initial;

      .serif-em {
        color: var(--accent);
        font-size: 1.05em;
      }
    }

    .page-cta-bottom {
      display: grid;
      gap: 28px;
      align-items: end;

      @media (min-width: 960px) {
        grid-template-columns: minmax(0, 44ch) auto;
        justify-content: space-between;
      }
    }

    .page-cta-text {
      font-size: clamp(16px, 1.3vw, 19px);
      line-height: 1.55;
      color: var(--fg-muted);
    }

    .page-cta-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      height: 60px;
      padding: 0 30px;
      border-radius: var(--radius-full);
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      transition:
        transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
        background-color 250ms ease,
        border-color 250ms ease;

      &:active {
        transform: scale(0.97);
      }

    }

    .pc-btn--solid {
        background: var(--accent);
        color: var(--accent-ink);

        &:hover {
          background: var(--accent-hover);
        }
      }

    .pc-btn--ghost {
        border: 1px solid var(--line);
        color: var(--fg);

        &:hover {
          border-color: var(--fg);
        }
      }

    @media (max-width: 420px) {
      .pc-btn {
        width: 100%;
      }
    }
  `,
})
export class PageCtaComponent {
  readonly lead = input.required<string>();
  readonly em = input.required<string>();
  readonly text = input.required<string>();
  readonly cta = input<string>('Chamar no WhatsApp');
  /** Mensagem pré-preenchida no WhatsApp para este contexto. */
  readonly message = input.required<string>();
  readonly secondaryLabel = input<string>('');
  readonly secondaryLink = input<string>('');

  protected readonly href = computed(() => whatsappUrl(this.message()));
}
