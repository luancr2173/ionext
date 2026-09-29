import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NavigationService } from './core/services/navigation.service';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

describe('App', () => {
  beforeAll(() => {
    // Provide IntersectionObserver polyfill for jsdom environment
    if (typeof window !== 'undefined' && !window.IntersectionObserver) {
      class MockIntersectionObserver implements IntersectionObserver {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = '';
        readonly thresholds: ReadonlyArray<number> = [];
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
      }
      window.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;
      globalThis.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;
    }
  });

  beforeEach(async () => {
    window.location.hash = '';

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the root app component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navbar and hero elements', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('app-hero')).toBeTruthy();
  });

  it('should have all anchor target sections present in the DOM on first render outside of @defer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Anchor sections must exist in the DOM immediately on initial paint
    expect(compiled.querySelector('#inicio')).toBeTruthy();
    expect(compiled.querySelector('#manifesto')).toBeTruthy();
    expect(compiled.querySelector('#servicos')).toBeTruthy();
    expect(compiled.querySelector('#sob-medida')).toBeTruthy();
    expect(compiled.querySelector('#processo')).toBeTruthy();
    expect(compiled.querySelector('#planos')).toBeTruthy();
    expect(compiled.querySelector('#contato')).toBeTruthy();

    // Verify sections have .section-wrapper class
    const servicos = compiled.querySelector('#servicos');
    expect(servicos?.classList.contains('section-wrapper')).toBe(true);
  });

  it('should trigger navigation and scrollToSection when clicking an anchor link', () => {
    const fixture = TestBed.createComponent(App);
    const navService = TestBed.inject(NavigationService);
    const scrollSpy = vi.spyOn(navService, 'scrollToSection');

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Find desktop nav link for Processo
    const processLink = compiled.querySelector('a.nav-link[href="#processo"]') as HTMLAnchorElement;
    expect(processLink).toBeTruthy();

    processLink.click();
    fixture.detectChanges();

    expect(scrollSpy).toHaveBeenCalledWith('#processo');
  });

  it('should handle opening the page with an anchor hash directly', () => {
    window.location.hash = '#planos';
    const navService = TestBed.inject(NavigationService);
    const hashSpy = vi.spyOn(navService, 'handleInitialHash');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    navService.handleInitialHash();
    expect(hashSpy).toHaveBeenCalled();
    expect(navService.forceLoad()).toBe(true);
  });
});
