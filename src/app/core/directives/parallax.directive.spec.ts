import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParallaxDirective } from './parallax.directive';
import { ScrollParallaxService } from '../services/scroll-parallax.service';
import { MotionService } from '../services/motion.service';

@Component({
  standalone: true,
  imports: [ParallaxDirective],
  template: `
    <div
      id="test-box"
      appParallax
      [appParallaxSpeed]="0.3"
      [appParallaxAxis]="'y'"
      [appParallaxMaxOffset]="50"
    >
      Content
    </div>
  `,
})
class TestHostComponent {}

describe('ParallaxDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let parallaxService: ScrollParallaxService;
  let motionService: MotionService;
  let element: HTMLElement;

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
      imports: [TestHostComponent],
      providers: [ScrollParallaxService, MotionService],
    }).compileComponents();

    parallaxService = TestBed.inject(ScrollParallaxService);
    motionService = TestBed.inject(MotionService);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    element = fixture.nativeElement.querySelector('#test-box');
  });

  it('should register the element with ScrollParallaxService on init', () => {
    expect(parallaxService.registeredCount).toBe(1);
  });

  it('should apply transform proportional to speed', () => {
    motionService.setMotionMode('enabled');

    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 200,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 100,
      toJSON: () => {},
    });

    parallaxService.updateAll();
    expect(element.style.transform).toContain('translate3d');
  });

  it('should respect maxOffset boundary', () => {
    motionService.setMotionMode('enabled');

    // Force element far away from center
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 5000,
      bottom: 5100,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 5000,
      toJSON: () => {},
    });

    parallaxService.updateAll();

    // With distance ~4600 and speed 0.3, offset would be ~1380, but maxOffset is 50
    const transform = element.style.transform;
    const hasCappedOffset = transform.includes('50.0px') || transform.includes('-50.0px');
    expect(hasCappedOffset).toBe(true);
  });

  it('should clear transform when motion is disabled', () => {
    motionService.setMotionMode('disabled');
    parallaxService.updateAll();

    expect(element.style.transform).toBe('');
  });

  it('should unregister upon component destroy', () => {
    expect(parallaxService.registeredCount).toBe(1);
    fixture.destroy();
    expect(parallaxService.registeredCount).toBe(0);
  });
});
