import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CountUpDirective } from './count-up.directive';
import { MotionService } from '../services/motion.service';

@Component({
  standalone: true,
  imports: [CountUpDirective],
  template: `<span [appCountUp]="targetValue" [countDuration]="50"></span>`,
})
class TestHostComponent {
  targetValue = 100;
}

describe('CountUpDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let motionService: MotionService;
  let observerCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null;

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

    class MockIntersectionObserver {
      constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        observerCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (window as any).IntersectionObserver = MockIntersectionObserver;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    motionService = TestBed.inject(MotionService);
    fixture = TestBed.createComponent(TestHostComponent);
  });

  afterEach(() => {
    observerCallback = null;
    delete (window as any).IntersectionObserver;
  });

  it('should show final value immediately when animations are disabled', () => {
    motionService.setMotionMode('disabled');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toBe('100');
  });

  it('should start at 0 when animations are enabled and wait for intersection', () => {
    motionService.setMotionMode('enabled');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toBe('0');
  });

  it('should animate to target value when intersecting', async () => {
    motionService.setMotionMode('enabled');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toBe('0');

    // Trigger intersection
    expect(observerCallback).toBeTruthy();
    observerCallback!([{ isIntersecting: true } as any]);

    // Wait for the short 50ms animation to finish
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(span.textContent).toBe('100');
  });
});
