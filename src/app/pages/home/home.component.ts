import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroComponent } from '../../features/hero/hero.component';
import { ManifestoComponent } from '../../features/manifesto/manifesto.component';
import { WhatsappMockupComponent } from '../../features/hero/whatsapp-mockup/whatsapp-mockup.component';
import { SITE_CONFIG, WHATSAPP_MESSAGES, whatsappUrl } from '../../core/config/site.config';
import { ContactService } from '../../core/services/contact.service';
import { MotionService } from '../../core/services/motion.service';
import { SmoothScrollService, motionRuntimeAvailable } from '../../core/services/smooth-scroll.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, ManifestoComponent, WhatsappMockupComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Hero imersivo com o funil 3D -->
    <app-hero />

    <!-- 2. Letreiro de integrações (reage à velocidade do scroll) -->
    <section class="marquee" aria-label="Integrações">
      <p class="mono-label marquee-label">{{ home.marqueeLabel }}</p>
      <div class="marquee-viewport">
        <div class="marquee-track" data-marquee>
          @for (copy of [0, 1]; track copy) {
            <div class="marquee-group" [attr.aria-hidden]="copy === 1 ? 'true' : null">
              @for (item of home.marquee; track item; let odd = $odd) {
                <span class="marquee-item" [class.is-outline]="odd">{{ item }}</span>
                <span class="marquee-sep" aria-hidden="true">✦</span>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- 3. Manifesto (palavras acendem com o scroll) -->
    <app-manifesto />

    <!-- 4. Serviços: lista numerada, cada um com seu WhatsApp -->
    <section id="servicos" class="services section-wrapper" aria-labelledby="servicos-title">
      <div class="container">
        <header class="sec-head">
          <p class="mono-label sec-index">(01) — O que fazemos</p>
          <h2 class="sec-title" id="servicos-title" data-split>
            <span class="split-line"><span class="split-word">Comece</span>&ngsp;<span class="split-word serif-em">por aqui.</span></span>
          </h2>
          <p class="sec-sub">{{ productsConfig.subtitle }} Implantação em semanas, não em meses.</p>
        </header>

        <ol class="svc-list">
          @for (product of productsConfig.items; track product.id; let idx = $index) {
            <li class="svc-row" data-row>
              <span class="mono-label svc-num">0{{ idx + 1 }}</span>
              <h3 class="svc-name">{{ product.name }}</h3>
              <div class="svc-body">
                <p class="svc-highlight">{{ product.highlight }}</p>
                <p class="svc-desc">{{ product.subtitle }}</p>
              </div>
              <a
                class="svc-cta"
                [href]="quoteUrls[product.id]"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="'Pedir orçamento de ' + product.name + ' pelo WhatsApp'"
              >
                <span>Orçamento</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </li>
          }
        </ol>

        <a routerLink="/servicos" class="text-link">
          <span>Ver todos os serviços e projetos sob medida</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <!-- 5. Demonstração do Neo -->
    <section id="neo" class="neo section-wrapper" aria-labelledby="neo-title">
      <div class="container neo-grid">
        <div class="neo-copy">
          <p class="mono-label sec-index">(02) — {{ home.neo.label }}</p>
          <h2 class="sec-title" id="neo-title" data-split>
            <span class="split-line"><span class="split-word">{{ home.neo.titleLead }}</span>&ngsp;<span class="split-word serif-em accent">{{ home.neo.titleEm }}</span></span>&ngsp;
            <span class="split-line"><span class="split-word">{{ home.neo.titleTail }}</span></span>
          </h2>
          <p class="sec-sub">{{ home.neo.text }}</p>
          <ul class="neo-bullets">
            @for (b of home.neo.bullets; track b; let i = $index) {
              <li data-row><span class="mono-label">0{{ i + 1 }}</span>{{ b }}</li>
            }
          </ul>
          <a class="btn btn--solid" [href]="neoUrl" target="_blank" rel="noopener noreferrer">
            <span>{{ home.neo.cta }}</span>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        </div>
        <div class="neo-device" data-parallax>
          <div class="neo-halo" aria-hidden="true"></div>
          <app-whatsapp-mockup />
        </div>
      </div>
    </section>

    <!-- 6. Processo com progresso no scroll -->
    <section id="como-funciona" class="process section-wrapper" aria-labelledby="processo-title" data-process>
      <div class="container">
        <header class="sec-head sec-head--split">
          <div>
            <p class="mono-label sec-index">(03) — Metodologia</p>
            <h2 class="sec-title" id="processo-title" data-split>
              <span class="split-line"><span class="split-word">Do</span>&ngsp;<span class="split-word">diagnóstico</span></span>&ngsp;
              <span class="split-line"><span class="split-word">à</span>&ngsp;<span class="split-word">operação</span>&ngsp;<span class="split-word serif-em">em</span>&ngsp;<span class="split-word serif-em">3</span>&ngsp;<span class="split-word serif-em">semanas.</span></span>
            </h2>
          </div>
          <p class="sec-sub">{{ processConfig.subtitle }}</p>
        </header>

        <div class="proc-track" aria-hidden="true"><span class="proc-progress" data-progress></span></div>

        <ol class="proc-steps">
          @for (step of processConfig.steps; track step.number) {
            <li class="proc-step" data-row>
              <div class="proc-top">
                <span class="proc-num">{{ step.number }}</span>
                <span class="mono-label proc-when">{{ step.duration }}</span>
              </div>
              <h3 class="proc-title">{{ step.title }}</h3>
              <p class="proc-summary">{{ step.summary }}</p>
              <p class="mono-label proc-deliverable">Entrega: {{ step.deliverable }}</p>
            </li>
          }
        </ol>

        <a routerLink="/processo" class="text-link">
          <span>Conheça o processo completo</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <!-- 7. CTA final -->
    <section class="final-cta" aria-labelledby="final-title">
      <div class="container">
        <p class="mono-label sec-index">(04) — Próximo passo</p>
        <h2 class="final-title" id="final-title" data-split>
          <span class="split-line"><span class="split-word">{{ home.finalCta.lead }}</span></span>&ngsp;
          <span class="split-line"><span class="split-word serif-em accent">{{ home.finalCta.em }}</span>&ngsp;<span class="split-word">{{ home.finalCta.tail }}</span></span>
        </h2>
        <div class="final-bottom">
          <p class="sec-sub">{{ home.finalCta.text }}</p>
          <div class="final-actions">
            <a class="btn btn--solid btn--xl" [href]="finalUrl" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
                <path d="M16 3.2a12.3 12.3 0 0 0-10.5 18.7L4 27.9l6.2-1.6A12.3 12.3 0 1 0 16 3.2Zm0 22.3c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.7 1 1-3.6-.3-.4a10 10 0 1 1 8.8 4.8Zm5.5-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z" />
              </svg>
              <span>{{ home.finalCta.cta }}</span>
            </a>
            <a routerLink="/planos" class="btn btn--ghost btn--xl">{{ home.finalCta.secondary }}</a>
          </div>
        </div>
        <ul class="final-meta">
          @for (m of home.finalCta.meta; track m) {
            <li class="mono-label">{{ m }}</li>
          }
        </ul>
      </div>
    </section>
  `,
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  protected readonly productsConfig = SITE_CONFIG.entryProducts;
  protected readonly processConfig = SITE_CONFIG.process;
  protected readonly home = SITE_CONFIG.home;
  protected readonly neoUrl = whatsappUrl(WHATSAPP_MESSAGES.neoDemo);
  protected readonly finalUrl = whatsappUrl(WHATSAPP_MESSAGES.finalCta);
  protected readonly quoteUrls: Record<string, string>;

  private readonly contactService = inject(ContactService);
  private readonly motion = inject(MotionService);
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private ctx?: gsap.Context;
  private marqueeTick?: (time: number, delta: number) => void;
  private viewReady = false;

  constructor() {
    this.quoteUrls = Object.fromEntries(
      this.productsConfig.items.map((p) => [
        p.id,
        this.contactService.getServiceQuoteWhatsAppUrl({
          name: p.name,
          subtitle: p.subtitle,
          description: p.description,
          highlight: p.highlight,
          id: p.id,
        }),
      ]),
    );

    effect(() => {
      const enabled = this.motion.animationsEnabled();
      if (this.viewReady) this.setupMotion(enabled);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.viewReady = true;
    this.setupMotion(this.motion.animationsEnabled());
  }

  /**
   * Todas as animações de scroll da home. Desativar = revert(): cada elemento volta
   * ao estado natural (visível), sem nada escondido esperando o GSAP.
   */
  private setupMotion(enabled: boolean): void {
    this.teardown();
    if (!enabled || !motionRuntimeAvailable()) return;

    const root = this.host.nativeElement as HTMLElement;

    this.ngZone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        // títulos saindo da máscara, palavra a palavra
        root.querySelectorAll<HTMLElement>('[data-split]').forEach((title) => {
          gsap.from(title.querySelectorAll('.split-word'), {
            yPercent: 110,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.06,
            scrollTrigger: { trigger: title, start: 'top 85%' },
          });
        });

        // linhas e itens entrando em sequência
        root.querySelectorAll<HTMLElement>('.svc-list, .neo-bullets, .proc-steps').forEach((list) => {
          gsap.from(list.querySelectorAll('[data-row]'), {
            y: 36,
            opacity: 0,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: list, start: 'top 82%' },
          });
        });

        // celular do Neo com paralaxe
        const device = root.querySelector('[data-parallax]');
        if (device) {
          gsap.fromTo(
            device,
            { yPercent: 10 },
            {
              yPercent: -10,
              ease: 'none',
              scrollTrigger: { trigger: device, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        }

        // barra de progresso do processo
        const process = root.querySelector('[data-process]');
        const progress = root.querySelector('[data-progress]');
        if (process && progress) {
          gsap.fromTo(
            progress,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: { trigger: process, start: 'top 70%', end: 'bottom 70%', scrub: true },
            },
          );
        }
      }, root);

      // letreiro: velocidade base + empurrão da velocidade do scroll
      const track = root.querySelector<HTMLElement>('[data-marquee]');
      if (track) {
        let x = 0;
        let boost = 0;
        this.marqueeTick = (_t, deltaMs) => {
          const dt = Math.min(deltaMs, 64) / 1000;
          boost = gsap.utils.interpolate(boost, this.smoothScroll.velocity * 0.9, 0.12);
          const half = track.scrollWidth / 2 || 1;
          x -= (60 + Math.abs(boost) * 22) * dt;
          if (x <= -half) x += half;
          track.style.transform = `translate3d(${x}px,0,0) skewX(${gsap.utils.clamp(-8, 8, -boost * 0.6)}deg)`;
        };
        gsap.ticker.add(this.marqueeTick);
      }
    });

    ScrollTrigger.refresh();
  }

  private teardown(): void {
    this.ctx?.revert();
    this.ctx = undefined;
    if (this.marqueeTick) {
      gsap.ticker.remove(this.marqueeTick);
      this.marqueeTick = undefined;
      const track = (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-marquee]');
      if (track) track.style.transform = '';
    }
  }

  ngOnDestroy(): void {
    this.teardown();
  }
}
