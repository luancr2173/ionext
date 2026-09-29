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

  it('should render the toggle button with aria-label and aria-pressed', () => {
    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Alternar tema');
  });

  it('should display the sun icon and aria-pressed="true" when theme is dark', () => {
    themeService.theme.set('dark');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('true');

    const sunIcon = fixture.nativeElement.querySelector('.icon-sun');
    const moonIcon = fixture.nativeElement.querySelector('.icon-moon');
    expect(sunIcon).toBeTruthy();
    expect(moonIcon).toBeNull();
  });

  it('should display the moon icon and aria-pressed="false" when theme is light', () => {
    themeService.theme.set('light');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    const sunIcon = fixture.nativeElement.querySelector('.icon-sun');
    const moonIcon = fixture.nativeElement.querySelector('.icon-moon');
    expect(moonIcon).toBeTruthy();
    expect(sunIcon).toBeNull();
  });

  it('should trigger themeService.toggle when clicked', () => {
    const toggleSpy = vi.spyOn(themeService, 'toggle').mockResolvedValue();
    const btn = fixture.nativeElement.querySelector('.theme-toggle-btn') as HTMLButtonElement;

    btn.click();
    expect(toggleSpy).toHaveBeenCalled();

    toggleSpy.mockRestore();
  });
});
