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
    const wordmarkEl = fixture.nativeElement.querySelector('.hero-wordmark');

    expect(titleEl).toBeTruthy();
    expect(subtitleEl).toBeTruthy();
    expect(ctaGroupEl).toBeTruthy();
    expect(wordmarkEl).toBeTruthy();

    expect(titleEl.classList.contains('reveal-init')).toBe(false);
    expect(subtitleEl.classList.contains('reveal-init')).toBe(false);
    expect(ctaGroupEl.classList.contains('reveal-init')).toBe(false);

    expect(titleEl.textContent.trim().length).toBeGreaterThan(0);
    expect(subtitleEl.textContent.trim().length).toBeGreaterThan(0);

    const buttons = ctaGroupEl.querySelectorAll('app-button');
    expect(buttons.length).toBe(2);
  });

  it('should render rotating word from SITE_CONFIG', () => {
    const rotatingWordEl = fixture.nativeElement.querySelector('.hero-rotating-word');
    expect(rotatingWordEl).toBeTruthy();
    expect(SITE_CONFIG.hero.rotatingWords).toContain(rotatingWordEl.textContent.trim());
  });

  it('should render stats bar with all stats from SITE_CONFIG', () => {
    const statItems = fixture.nativeElement.querySelectorAll('.hero-stat-item');
    expect(statItems.length).toBe(SITE_CONFIG.hero.stats.length);
  });

  it('should render the whatsapp mockup component in hero', () => {
    const mockupEl = fixture.nativeElement.querySelector('app-whatsapp-mockup');
    expect(mockupEl).toBeTruthy();
  });

  it('should support light and dark theme mode on container', () => {
    const heroSection = fixture.nativeElement.querySelector('.hero-section');
    expect(heroSection).toBeTruthy();

    // Verify both wordmark images exist for dark/light visibility toggling
    const wordmarkImgs = heroSection.querySelectorAll('.hero-wordmark-img');
    expect(wordmarkImgs.length).toBe(2);
    expect(wordmarkImgs[0].classList.contains('dark-only')).toBe(true);
    expect(wordmarkImgs[1].classList.contains('light-only')).toBe(true);
  });
});
