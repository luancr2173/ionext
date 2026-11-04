import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MotionService, MOTION_STORAGE_KEY } from './motion.service';

describe('MotionService', () => {
  let service: MotionService;
  let store: Map<string, string>;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    store = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

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

    TestBed.configureTestingModule({
      providers: [MotionService],
    });
    service = TestBed.inject(MotionService);
  });

  afterEach(() => {
    store.clear();
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should be created with default auto mode', () => {
    expect(service).toBeTruthy();
    expect(service.motionMode()).toBe('auto');
  });

  it('should update motion mode and persist to localStorage', () => {
    service.setMotionMode('disabled');
    expect(service.motionMode()).toBe('disabled');
    expect(store.get(MOTION_STORAGE_KEY)).toBe('disabled');

    service.setMotionMode('enabled');
    expect(service.motionMode()).toBe('enabled');
    expect(store.get(MOTION_STORAGE_KEY)).toBe('enabled');
  });

  it('should return false for animationsEnabled when mode is disabled', () => {
    service.setMotionMode('disabled');
    expect(service.animationsEnabled()).toBe(false);
  });

  it('should return true for animationsEnabled when mode is enabled even if prefersReducedMotion is true', () => {
    service.prefersReducedMotion.set(true);
    service.setMotionMode('enabled');
    expect(service.animationsEnabled()).toBe(true);
  });

  it('should respect prefersReducedMotion in auto mode', () => {
    service.setMotionMode('auto');

    service.prefersReducedMotion.set(false);
    expect(service.animationsEnabled()).toBe(true);

    service.prefersReducedMotion.set(true);
    expect(service.animationsEnabled()).toBe(false);
  });
});
