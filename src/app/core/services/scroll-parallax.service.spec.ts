import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollParallaxService } from './scroll-parallax.service';
import { MotionService } from './motion.service';

describe('ScrollParallaxService', () => {
  let service: ScrollParallaxService;
  let motionService: MotionService;

  beforeEach(() => {
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

    TestBed.configureTestingModule({
      providers: [ScrollParallaxService, MotionService],
    });

    motionService = TestBed.inject(MotionService);
    service = TestBed.inject(ScrollParallaxService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created and start with 0 registered items', () => {
    expect(service).toBeTruthy();
    expect(service.registeredCount).toBe(0);
    expect(service.isListenerActive).toBe(false);
  });

  it('should register an element and attach the single scroll listener', () => {
    const div = document.createElement('div');
    service.register(div, { speed: 0.2, axis: 'y', maxOffset: 50 });

    expect(service.registeredCount).toBe(1);
    expect(service.isListenerActive).toBe(true);

    service.unregister(div);
    expect(service.registeredCount).toBe(0);
    expect(service.isListenerActive).toBe(false);
  });

  it('should keep single listener when multiple elements are registered', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    service.register(div1, { speed: 0.1, axis: 'y', maxOffset: 50 });
    service.register(div2, { speed: 0.2, axis: 'y', maxOffset: 50 });

    expect(service.registeredCount).toBe(2);
    // Should have attached scroll listener only once upon first registration
    const scrollListeners = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'scroll');
    expect(scrollListeners.length).toBe(1);

    service.unregister(div1);
    expect(service.isListenerActive).toBe(true); // Still active for div2

    service.unregister(div2);
    expect(service.isListenerActive).toBe(false); // Detached when 0 items
  });

  it('should apply transform proportional to speed when animations are enabled', () => {
    motionService.setMotionMode('enabled');

    const div = document.createElement('div');
    // Mock getBoundingClientRect
    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
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

    service.register(div, { speed: 0.2, axis: 'y', maxOffset: 100 });
    service.updateAll();

    expect(div.style.transform).toContain('translate3d');

    service.unregister(div);
  });

  it('should clear transform when motion mode is disabled', () => {
    motionService.setMotionMode('enabled');

    const div = document.createElement('div');
    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
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

    service.register(div, { speed: 0.2, axis: 'y', maxOffset: 100 });
    service.updateAll();
    expect(div.style.transform).toContain('translate3d');

    // Disable animations
    motionService.setMotionMode('disabled');
    service.updateAll();

    expect(div.style.transform).toBe('');

    service.unregister(div);
  });
});

