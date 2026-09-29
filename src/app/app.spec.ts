import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

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
});
