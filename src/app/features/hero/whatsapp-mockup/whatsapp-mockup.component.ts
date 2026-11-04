import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONFIG, NeoChatMessage } from '../../../core/config/site.config';
import { MotionService } from '../../../core/services/motion.service';

@Component({
  selector: 'app-whatsapp-mockup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="wa-mockup"
      aria-hidden="true"
      #mockupEl
    >
      <!-- Header -->
      <div class="wa-header">
        <div class="wa-avatar">
          <span class="wa-avatar-icon" aria-hidden="true">🤖</span>
        </div>
        <div class="wa-header-info">
          <span class="wa-contact-name">{{ chatConfig.botName }}</span>
          <span class="wa-status">
            <span class="wa-status-dot"></span>
            {{ chatConfig.status }}
          </span>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="wa-messages" #messagesArea>
        @for (msg of visibleMessages(); track $index) {
          <div
            class="wa-bubble"
            [class.wa-bubble--bot]="msg.sender === 'neo'"
            [class.wa-bubble--client]="msg.sender === 'client'"
          >
            <p class="wa-bubble-text">{{ msg.text }}</p>
            @if (msg.time) {
              <span class="wa-bubble-time">{{ msg.time }}</span>
            }
          </div>
        }

        @if (isTyping()) {
          <div class="wa-bubble wa-bubble--bot wa-typing-bubble">
            <div class="wa-typing-indicator">
              <span class="wa-typing-dot"></span>
              <span class="wa-typing-dot"></span>
              <span class="wa-typing-dot"></span>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Accessible fallback for screen readers -->
    <div class="sr-only">
      {{ chatConfig.botRole }} — conversa demonstrativa de qualificação de cliente
    </div>
  `,
  styleUrl: './whatsapp-mockup.component.scss',
})
export class WhatsappMockupComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly motionService = inject(MotionService);
  private readonly ngZone = inject(NgZone);
  private readonly hostEl = inject(ElementRef);

  @ViewChild('messagesArea') messagesAreaRef?: ElementRef<HTMLDivElement>;

  protected readonly chatConfig = SITE_CONFIG.hero.neoChat;
  private readonly allMessages: NeoChatMessage[] = [...SITE_CONFIG.hero.neoChat.messages];

  readonly visibleMessages = signal<NeoChatMessage[]>([]);
  readonly isTyping = signal<boolean>(false);

  private observer?: IntersectionObserver;
  private isVisible = false;
  private timeouts: ReturnType<typeof setTimeout>[] = [];
  private isDestroyed = false;
  private loopRunning = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: show all messages
      this.visibleMessages.set([...this.allMessages]);
      return;
    }

    if (!this.motionService.animationsEnabled() || typeof IntersectionObserver === 'undefined') {
      // Show all messages immediately
      this.visibleMessages.set([...this.allMessages]);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible && !this.loopRunning) {
              this.startMessageLoop();
            }
          }
        },
        { threshold: 0.15 },
      );
      this.observer.observe(this.hostEl.nativeElement);
    });
  }

  private startMessageLoop(): void {
    this.loopRunning = true;
    this.showMessagesSequentially(0);
  }

  private showMessagesSequentially(index: number): void {
    if (this.isDestroyed || !this.isVisible) {
      this.loopRunning = false;
      return;
    }

    if (index >= this.allMessages.length) {
      // All messages shown, wait then restart
      const restartTimeout = setTimeout(() => {
        if (this.isDestroyed) return;
        this.ngZone.run(() => {
          this.visibleMessages.set([]);
          this.isTyping.set(false);
        });
        // Small pause before restarting
        const loopTimeout = setTimeout(() => {
          if (!this.isDestroyed && this.isVisible) {
            this.showMessagesSequentially(0);
          } else {
            this.loopRunning = false;
          }
        }, 1200);
        this.timeouts.push(loopTimeout);
      }, 4000);
      this.timeouts.push(restartTimeout);
      return;
    }

    // Show typing indicator
    this.ngZone.run(() => {
      this.isTyping.set(true);
    });

    // After typing delay, show message
    const typingDelay = this.allMessages[index].sender === 'neo' ? 1200 : 800;
    const msgTimeout = setTimeout(() => {
      if (this.isDestroyed) return;
      this.ngZone.run(() => {
        this.isTyping.set(false);
        this.visibleMessages.update((msgs) => [...msgs, this.allMessages[index]]);
      });

      // Scroll messages area
      requestAnimationFrame(() => {
        if (this.messagesAreaRef?.nativeElement) {
          this.messagesAreaRef.nativeElement.scrollTop =
            this.messagesAreaRef.nativeElement.scrollHeight;
        }
      });

      // Next message after a pause
      const nextTimeout = setTimeout(() => {
        this.showMessagesSequentially(index + 1);
      }, 600);
      this.timeouts.push(nextTimeout);
    }, typingDelay);
    this.timeouts.push(msgTimeout);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.observer?.disconnect();
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts = [];
  }
}
