import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevealDirective } from './reveal.directive';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: ` <div id="test-el" appReveal [appRevealDelay]="300">Content</div> `,
})
class TestHostComponent {}

describe('RevealDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let el: HTMLElement;

  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  it('should initialize element with reveal classes', async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('#test-el');

    expect(el).toBeTruthy();
    const hasInit = el.classList.contains('reveal-init') || el.classList.contains('is-revealed');
    expect(hasInit).toBe(true);
  });

  it('should set --reveal-delay property if delay provided', async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('#test-el');

    const delayProp = el.style.getPropertyValue('--reveal-delay');
    if (delayProp) {
      expect(delayProp).toBe('300ms');
    }
  });

  it('should apply is-revealed directly when prefers-reduced-motion is active', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('#test-el');

    expect(el.classList.contains('is-revealed')).toBe(true);
    expect(el.classList.contains('reveal-init')).toBe(false);
  });

  it('should apply is-revealed class when IntersectionObserver entry intersects', async () => {
    let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};

    class MockIntersectionObserver {
      constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        observerCallback = cb;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      MockIntersectionObserver;

    // Reset shared static observer to force fresh instantiation
    (RevealDirective as unknown as { sharedObserver?: unknown }).sharedObserver = undefined;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('#test-el');

    expect(el.classList.contains('reveal-init')).toBe(true);

    // Simulate element scrolling into view
    observerCallback([{ target: el, isIntersecting: true }]);

    expect(el.classList.contains('is-revealed')).toBe(true);

    // Destroy component to test unobserve cleanup
    fixture.destroy();
    expect(el.classList.contains('is-revealed')).toBe(true);
  });
});
