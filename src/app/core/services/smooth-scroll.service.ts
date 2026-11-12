import { Injectable, inject, effect, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionService } from './motion.service';

/** GSAP/Lenis precisam de um navegador de verdade (jsdom nos testes não tem matchMedia). */
export function motionRuntimeAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    typeof IntersectionObserver !== 'undefined'
  );
}

/**
 * Rolagem suave (Lenis) sincronizada com o GSAP ScrollTrigger.
 *
 * - Liga/desliga junto com o seletor "Animações" (MotionService).
 * - Pausa enquanto o menu mobile ou um modal trava a rolagem
 *   (classes `is-menu-open` / `is-modal-open` no <html>).
 * - Com animações desativadas a página usa a rolagem nativa do navegador.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly motion = inject(MotionService);

  private lenis?: Lenis;
  private readonly raf = (time: number) => this.lenis?.raf(time * 1000);
  private lockObserver?: MutationObserver;

  /** Velocidade de rolagem atual (px/frame aprox.), usada pelo letreiro. */
  get velocity(): number {
    return this.lenis?.velocity ?? 0;
  }

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !motionRuntimeAvailable()) return;

    gsap.registerPlugin(ScrollTrigger);

    effect(() => {
      const enabled = this.motion.animationsEnabled();
      document.documentElement.classList.toggle('motion-off', !enabled);
      this.ngZone.runOutsideAngular(() => (enabled ? this.start() : this.stop()));
    });
  }

  private start(): void {
    if (this.lenis) return;

    this.lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      // modais e menu mobile (role="dialog") rolam nativamente, mesmo com o Lenis parado
      prevent: (node) => node.getAttribute('role') === 'dialog',
    });
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(this.raf);
    gsap.ticker.lagSmoothing(0);

    const root = document.documentElement;
    const syncLock = () => {
      const locked = root.classList.contains('is-menu-open') || root.classList.contains('is-modal-open');
      if (locked) this.lenis?.stop();
      else this.lenis?.start();
    };
    this.lockObserver = new MutationObserver(syncLock);
    this.lockObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
    syncLock();

    ScrollTrigger.refresh();
  }

  private stop(): void {
    this.lockObserver?.disconnect();
    this.lockObserver = undefined;
    if (!this.lenis) return;
    gsap.ticker.remove(this.raf);
    this.lenis.destroy();
    this.lenis = undefined;
    ScrollTrigger.refresh();
  }
}
