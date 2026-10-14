import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { NavigationService } from './core/services/navigation.service';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

describe('App', () => {
  beforeAll(() => {
    // Provide IntersectionObserver polyfill for jsdom environment
    if (typeof window !== 'undefined' && !window.IntersectionObserver) {
      class MockIntersectionObserver implements IntersectionObserver {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = '';
        readonly scrollMargin: string = '';
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
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the root app component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navbar, router-outlet, footer and transition bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
    expect(compiled.querySelector('.page-transition-bar')).toBeTruthy();
  });

  it('should track navigation state', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app.isNavigating()).toBe(false);
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
