import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WHATSAPP_MESSAGES, whatsappUrl } from '../../../core/config/site.config';

/** Botão flutuante do WhatsApp, fixo no canto inferior direito em todas as páginas. */
@Component({
  selector: 'app-whatsapp-float',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="wa-float"
      [href]="href"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar com a Ionext pelo WhatsApp"
      title="Fale com a gente no WhatsApp"
    >
      <span class="wa-ping" aria-hidden="true"></span>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16 3.2a12.3 12.3 0 0 0-10.5 18.7L4 27.9l6.2-1.6A12.3 12.3 0 1 0 16 3.2Zm0 22.3c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.7 1 1-3.6-.3-.4a10 10 0 1 1 8.8 4.8Zm5.5-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z"
        />
      </svg>
    </a>
  `,
  styles: `
    :host {
      display: contents;
    }

    .wa-float {
      position: fixed;
      right: calc(20px + env(safe-area-inset-right, 0px));
      bottom: calc(24px + env(safe-area-inset-bottom, 0px));
      z-index: 96;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #25d366;
      color: #ffffff;
      box-shadow: 0 10px 30px -8px rgba(37, 211, 102, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25);
      transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        transform: scale(1.07);
      }

      &:active {
        transform: scale(0.95);
      }

      &:focus-visible {
        outline: 2px solid var(--fg);
        outline-offset: 4px;
      }

      svg {
        position: relative;
      }
    }

    .wa-ping {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #25d366;
      animation: waPing 2.6s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes waPing {
      0% {
        transform: scale(1);
        opacity: 0.45;
      }
      70%,
      100% {
        transform: scale(1.6);
        opacity: 0;
      }
    }

    :host-context(html.motion-off) .wa-ping {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .wa-ping {
        display: none;
      }
    }
  `,
})
export class WhatsappFloatComponent {
  protected readonly href = whatsappUrl(WHATSAPP_MESSAGES.floating);
}
