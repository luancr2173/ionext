import { TestBed } from '@angular/core/testing';
import { NavigationService } from './navigation.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    // Clear hash
    window.location.hash = '';

    TestBed.configureTestingModule({
      providers: [NavigationService],
    });

    service = TestBed.inject(NavigationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('.test-target-section').forEach((el) => el.remove());
  });

  it('should be created with forceLoad false by default when hash is empty', () => {
    expect(service).toBeTruthy();
    expect(service.forceLoad()).toBe(false);
  });

  it('should set forceLoad true and scroll to section when scrollToSection is called', async () => {
    const section = document.createElement('section');
    section.id = 'processo';
    section.className = 'test-target-section';
    const heading = document.createElement('h2');
    heading.textContent = 'Processo';
    section.appendChild(heading);
    document.body.appendChild(section);

    const scrollIntoViewSpy = vi.fn();
    section.scrollIntoView = scrollIntoViewSpy;

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    service.scrollToSection('#processo');
    expect(service.forceLoad()).toBe(true);

    // Wait for requestAnimationFrame frames
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#processo');
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('should handle alias #produtos by resolving to #servicos', async () => {
    const section = document.createElement('section');
    section.id = 'servicos';
    section.className = 'test-target-section';
    document.body.appendChild(section);

    const scrollIntoViewSpy = vi.fn();
    section.scrollIntoView = scrollIntoViewSpy;

    service.scrollToSection('#produtos');
    expect(service.forceLoad()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it('should respect prefers-reduced-motion by using auto scroll behavior', async () => {
    const section = document.createElement('section');
    section.id = 'planos';
    section.className = 'test-target-section';
    document.body.appendChild(section);

    const scrollIntoViewSpy = vi.fn();
    section.scrollIntoView = scrollIntoViewSpy;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    service.scrollToSection('#planos');

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    });
  });

  it('should force load and scroll when initialized with hash in URL', async () => {
    const section = document.createElement('section');
    section.id = 'contato';
    section.className = 'test-target-section';
    document.body.appendChild(section);

    const scrollIntoViewSpy = vi.fn();
    section.scrollIntoView = scrollIntoViewSpy;

    // Simulate opening with hash
    window.location.hash = '#contato';
    service.handleInitialHash();

    expect(service.forceLoad()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });
});
