import { TestBed } from '@angular/core/testing';
import { NavigationService, calculateScrollDuration, easeApple } from './navigation.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    window.location.hash = '';
    window.scrollTo = vi.fn();

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

  describe('calculateScrollDuration', () => {
    it('should return minimum duration (450ms) for small distances', () => {
      expect(calculateScrollDuration(0)).toBe(450);
      expect(calculateScrollDuration(50)).toBe(458);
    });

    it('should return maximum duration (900ms) for distances >= 3000px', () => {
      expect(calculateScrollDuration(3000)).toBe(900);
      expect(calculateScrollDuration(6000)).toBe(900);
    });

    it('should calculate proportional duration for intermediate distances', () => {
      const dur = calculateScrollDuration(1500);
      expect(dur).toBe(675);
      expect(dur).toBeGreaterThanOrEqual(450);
      expect(dur).toBeLessThanOrEqual(900);
    });
  });

  describe('easeApple', () => {
    it('should return boundary values at 0 and 1', () => {
      expect(easeApple(0)).toBe(0);
      expect(easeApple(1)).toBe(1);
    });

    it('should exhibit quick start and smooth landing curve', () => {
      const mid = easeApple(0.5);
      // Apple curve (0.16, 1, 0.3, 1) starts fast, so mid progress is high (> 0.8)
      expect(mid).toBeGreaterThan(0.8);
      expect(mid).toBeLessThan(1);
    });
  });

  describe('animateScrollTo & cancellation', () => {
    it('should animate scroll to target position and trigger arrival callback', async () => {
      const onArrival = vi.fn();
      let rafCb: FrameRequestCallback = () => {};
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCb = cb;
        return 123;
      });

      service.animateScrollTo(500, onArrival);
      expect(window.requestAnimationFrame).toHaveBeenCalled();

      // Trigger animation finish
      rafCb(performance.now() + 1000);
      expect(onArrival).toHaveBeenCalled();
    });

    it('should cancel active scroll when user touch or wheel event occurs', () => {
      vi.spyOn(window, 'cancelAnimationFrame');
      let rafCb: FrameRequestCallback = () => {};
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCb = cb;
        return 456;
      });

      const onArrival = vi.fn();
      service.animateScrollTo(1000, onArrival);

      // Simulate user touch gesture
      window.dispatchEvent(new Event('touchstart'));

      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(456);
      expect(onArrival).not.toHaveBeenCalled();
    });
  });

  describe('scrollToSection', () => {
    it('should set forceLoad true and scroll to section when scrollToSection is called', async () => {
      const section = document.createElement('section');
      section.id = 'processo';
      section.className = 'test-target-section';
      const heading = document.createElement('h2');
      heading.className = 'section-title';
      heading.textContent = 'Processo';
      section.appendChild(heading);
      document.body.appendChild(section);

      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const animateScrollSpy = vi.spyOn(service, 'animateScrollTo');

      service.scrollToSection('#processo');
      expect(service.forceLoad()).toBe(true);

      // Wait for rendering frames
      await new Promise((resolve) => setTimeout(resolve, 120));

      expect(animateScrollSpy).toHaveBeenCalled();
      // Invoke arrival callback manually to test post-scroll logic
      const arrivalCallback = animateScrollSpy.mock.calls[0][1];
      arrivalCallback?.();

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#processo');
      expect(heading.getAttribute('tabindex')).toBe('-1');
      expect(heading.classList.contains('section-title-highlight')).toBe(true);
    });

    it('should handle alias #produtos by resolving to #servicos', async () => {
      const section = document.createElement('section');
      section.id = 'servicos';
      section.className = 'test-target-section';
      document.body.appendChild(section);

      const animateScrollSpy = vi.spyOn(service, 'animateScrollTo');

      service.scrollToSection('#produtos');
      expect(service.forceLoad()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(animateScrollSpy).toHaveBeenCalled();
    });

    it('should respect prefers-reduced-motion with direct window.scrollTo', async () => {
      const section = document.createElement('section');
      section.id = 'planos';
      section.className = 'test-target-section';
      document.body.appendChild(section);

      const scrollToSpy = vi.spyOn(window, 'scrollTo');

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

      expect(scrollToSpy).toHaveBeenCalled();
    });
  });
});
