import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('should initialize with system default when localStorage is empty', () => {
    // Mock prefers-color-scheme: dark
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

    // Initial is dark
    service.theme.set('dark');
    document.documentElement.setAttribute('data-theme', 'dark');

    // Toggle to light
    await service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Toggle back to dark
    await service.toggle();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
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

  it('should handle localStorage throwing SecurityError or QuotaExceeded gracefully', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: Access is denied');
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);

    // Should not throw even if setItem fails
    await expect(service.toggle()).resolves.not.toThrow();
  });
});
