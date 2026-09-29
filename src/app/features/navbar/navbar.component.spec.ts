import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { ScrollService } from '../../core/services/scroll.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    // Reset class on html before each test
    document.documentElement.classList.remove('is-menu-open');

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [ScrollService],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Always clean up class to ensure test isolation
    document.documentElement.classList.remove('is-menu-open');
  });

  it('should create the navbar component', () => {
    expect(component).toBeTruthy();
  });

  it('should have mobile menu closed by default without is-menu-open class', () => {
    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');

    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Abrir menu de navegação');
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(false);
  });

  it('should open mobile menu when hamburger toggle is clicked and apply is-menu-open to html', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    toggleBtn.click();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    expect(overlay.classList.contains('is-open')).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('false');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Fechar menu de navegação');
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);
  });

  it('should close mobile menu when hamburger toggle is clicked again and remove is-menu-open', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    // Open
    toggleBtn.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);

    // Close
    toggleBtn.click();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Abrir menu de navegação');
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(false);
  });

  it('should close mobile menu and remove is-menu-open on ESC key', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    toggleBtn.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);

    // Trigger ESC
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(false);
  });

  it('should close mobile menu and remove is-menu-open when clicking a mobile nav link', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    toggleBtn.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);

    const firstLink = fixture.nativeElement.querySelector('.mobile-nav-link') as HTMLAnchorElement;
    expect(firstLink).toBeTruthy();
    firstLink.click();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(false);
  });

  it('should close mobile menu and remove is-menu-open on window resize to desktop width (>= 820px)', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    toggleBtn.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);

    // Simulate resize to desktop (e.g. 1024px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(false);
  });

  it('should keep mobile menu open on window resize when still in mobile width (< 820px)', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    toggleBtn.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);

    // Simulate resize on mobile (e.g. 390px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('#mobile-navigation-menu');
    expect(overlay.classList.contains('is-open')).toBe(true);
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);
  });

  it('should clean up is-menu-open class when component is destroyed while menu is open', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.mobile-toggle');
    toggleBtn.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(true);

    fixture.destroy();
    expect(document.documentElement.classList.contains('is-menu-open')).toBe(false);
  });
});
