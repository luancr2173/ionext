import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeroComponent } from './hero.component';
import { ScrollService } from '../../core/services/scroll.service';
import { MotionService } from '../../core/services/motion.service';
import { SITE_CONFIG } from '../../core/config/site.config';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HeroComponent', () => {
  let component: HeroComponent;
  let fixture: ComponentFixture<HeroComponent>;

  beforeEach(async () => {
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
      },
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [ScrollService, MotionService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the hero component', () => {
    expect(component).toBeTruthy();
  });

  it('should render hero title, subtitle and CTAs immediately without reveal-init classes', () => {
    const titleEl = fixture.nativeElement.querySelector('.hero-title');
    const subtitleEl = fixture.nativeElement.querySelector('.hero-subtitle');
    const ctaGroupEl = fixture.nativeElement.querySelector('.hero-cta-group');

    expect(titleEl).toBeTruthy();
    expect(subtitleEl).toBeTruthy();
    expect(ctaGroupEl).toBeTruthy();

    expect(titleEl.classList.contains('reveal-init')).toBe(false);
    expect(subtitleEl.classList.contains('reveal-init')).toBe(false);
    expect(ctaGroupEl.classList.contains('reveal-init')).toBe(false);

    // palavras do título separadas por espaço (não "IAnoseu")
    expect(titleEl.textContent.replace(/\s+/g, ' ').trim()).toMatch(/^IA no seu funil de /);
    expect(subtitleEl.textContent.trim().length).toBeGreaterThan(0);

    const links = ctaGroupEl.querySelectorAll('a');
    expect(links.length).toBe(2);
  });

  it('should open WhatsApp with a pre-filled message on the primary CTA', () => {
    const primary: HTMLAnchorElement = fixture.nativeElement.querySelector('.hero-btn--solid');
    expect(primary.href).toContain('https://wa.me/');
    expect(primary.href).toContain('text=');
    expect(primary.target).toBe('_blank');
    expect(primary.rel).toContain('noopener');
  });

  it('should render rotating word from SITE_CONFIG', () => {
    const rotatingWordEl = fixture.nativeElement.querySelector('.hero-rotating-word');
    expect(rotatingWordEl).toBeTruthy();
    const word = rotatingWordEl.textContent.trim().replace(/\.$/, '');
    expect(SITE_CONFIG.hero.rotatingWords).toContain(word);
  });

  it('should render stats bar with all stats from SITE_CONFIG', () => {
    const statItems = fixture.nativeElement.querySelectorAll('.hero-stat-item');
    expect(statItems.length).toBe(SITE_CONFIG.hero.stats.length);
  });

  it('should render the 3D stage canvas behind the content', () => {
    const canvas = fixture.nativeElement.querySelector('.hero-stage canvas.hero-canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.closest('.hero-stage').getAttribute('aria-hidden')).toBe('true');
  });
});
