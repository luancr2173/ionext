import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;

  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
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
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('should initialize with system default when localStorage is empty', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      return {
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should restore stored preference from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should toggle between dark and light themes and persist to localStorage', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);

    service.theme.set('dark');
    document.documentElement.setAttribute('data-theme', 'dark');

    await service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await service.toggle();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should call startViewTransition when available and animate root clip-path', async () => {
    const mockReady = Promise.resolve();
    const mockFinished = Promise.resolve();
    const mockSkip = vi.fn();
    const mockAnimate = vi.fn();

    document.documentElement.animate = mockAnimate;

    const mockStartViewTransition = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: mockReady,
        finished: mockFinished,
        skipTransition: mockSkip,
      };
    });

    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      mockStartViewTransition;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
    service.theme.set('dark');

    const button = document.createElement('button');
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 100,
      width: 40,
      height: 40,
      bottom: 50,
      right: 140,
      x: 100,
      y: 10,
      toJSON: () => {},
    });

    await service.toggle(button);

    expect(mockStartViewTransition).toHaveBeenCalled();
    expect(service.theme()).toBe('light');
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.objectContaining({
        clipPath: expect.arrayContaining([expect.stringContaining('circle(')]),
      }),
      expect.objectContaining({
        pseudoElement: '::view-transition-new(root)',
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }),
    );

    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
  });

  it('should apply and remove fallback theme-transition class when startViewTransition is absent', async () => {
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
    service.theme.set('dark');

    const togglePromise = service.toggle();
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);
    expect(service.theme()).toBe('light');

    await togglePromise;

    // Fast forward fallback timer (350ms)
    await new Promise((resolve) => setTimeout(resolve, 380));
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
  });

  it('should bypass transitions entirely when prefers-reduced-motion is true', async () => {
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

    const mockStartViewTransition = vi.fn();
    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      mockStartViewTransition;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
    service.theme.set('dark');

    await service.toggle();

    expect(mockStartViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
    expect(service.theme()).toBe('light');

    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
  });

  it('should call skipTransition on rapid clicks and not freeze UI', async () => {
    const mockSkip = vi.fn();
    let resolveReady: () => void;
    const pendingReady = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const mockStartViewTransition = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: pendingReady,
        finished: new Promise(() => {}),
        skipTransition: mockSkip,
      };
    });

    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      mockStartViewTransition;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
    service.theme.set('dark');

    // First toggle starts
    const firstCall = service.toggle();
    // Immediate second toggle occurs before first finishes
    const secondCall = service.toggle();

    expect(mockSkip).toHaveBeenCalledTimes(1);

    resolveReady!();
    await Promise.allSettled([firstCall, secondCall]);
    expect(service.theme()).toBe('dark'); // dark -> light -> dark

    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
  });

  it('should update meta theme-color tag when theme changes', async () => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);

    service.theme.set('dark');
    await service.toggle(); // switches to light
    expect(meta.getAttribute('content')).toBe('#ffffff');

    await service.toggle(); // switches to dark
    expect(meta.getAttribute('content')).toBe('#000000');
  });

  it('should handle localStorage throwing SecurityError gracefully', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: Access is denied');
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);

    await expect(service.toggle()).resolves.not.toThrow();
  });
});
