import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('should render the toggle switch button with aria-label and role', () => {
    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Alternar tema');
    expect(btn.getAttribute('role')).toBe('switch');
  });

  it('should display dark state and active moon icon when theme is dark', () => {
    themeService.theme.set('dark');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-checked')).toBe('true');
    expect(btn.classList.contains('is-dark')).toBe(true);

    const moonIcon = fixture.nativeElement.querySelector('.thumb-icon.icon-moon');
    const sunIcon = fixture.nativeElement.querySelector('.thumb-icon.icon-sun');
    expect(moonIcon).toBeTruthy();
    expect(moonIcon.classList.contains('is-active')).toBe(true);
    expect(sunIcon.classList.contains('is-active')).toBe(false);
  });

  it('should display light state and active sun icon when theme is light', () => {
    themeService.theme.set('light');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-checked')).toBe('false');
    expect(btn.classList.contains('is-light')).toBe(true);

    const sunIcon = fixture.nativeElement.querySelector('.thumb-icon.icon-sun');
    const moonIcon = fixture.nativeElement.querySelector('.thumb-icon.icon-moon');
    expect(sunIcon).toBeTruthy();
    expect(sunIcon.classList.contains('is-active')).toBe(true);
    expect(moonIcon.classList.contains('is-active')).toBe(false);
  });

  it('should trigger themeService.toggle when clicked', () => {
    const toggleSpy = vi.spyOn(themeService, 'toggle').mockResolvedValue();
    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;

    btn.click();
    expect(toggleSpy).toHaveBeenCalled();

    toggleSpy.mockRestore();
  });
});
