import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero.component';
import { ScrollService } from '../../core/services/scroll.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HeroComponent', () => {
  let component: HeroComponent;
  let fixture: ComponentFixture<HeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [ScrollService],
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

    // Progressive enhancement: None of these above-the-fold elements should have reveal-init class
    expect(titleEl.classList.contains('reveal-init')).toBe(false);
    expect(subtitleEl.classList.contains('reveal-init')).toBe(false);
    expect(ctaGroupEl.classList.contains('reveal-init')).toBe(false);

    // Text content should be rendered
    expect(titleEl.textContent.trim().length).toBeGreaterThan(0);
    expect(subtitleEl.textContent.trim().length).toBeGreaterThan(0);

    // Both CTA buttons should be present
    const buttons = ctaGroupEl.querySelectorAll('app-button');
    expect(buttons.length).toBe(2);
  });
});
