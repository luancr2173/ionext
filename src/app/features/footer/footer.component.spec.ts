import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { IONEXT_WHATSAPP_URL } from '../../core/config/site.config';
import { MotionService } from '../../core/services/motion.service';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let motionService: MotionService;

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
      imports: [FooterComponent],
      providers: [MotionService, provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    motionService = TestBed.inject(MotionService);
    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('shows all contact channels as accessible icons', () => {
    const links = fixture.nativeElement.querySelectorAll(
      '.footer-contact-icons a',
    ) as NodeListOf<HTMLAnchorElement>;
    const whatsappLink = fixture.nativeElement.querySelector(
      '.footer-contact-icons a[aria-label="Falar com a Ionext pelo WhatsApp"]',
    ) as HTMLAnchorElement;

    expect(links).toHaveLength(4);
    links.forEach((link) => {
      expect(link.querySelector('svg')).toBeTruthy();
      expect(link.getAttribute('aria-label')).toBeTruthy();
    });
    expect(whatsappLink.href).toBe(IONEXT_WHATSAPP_URL);
    expect(whatsappLink.target).toBe('_blank');
    expect(whatsappLink.rel).toContain('noopener');
    expect(fixture.nativeElement.querySelector('.location-text svg')).toBeTruthy();
  });

  it('renders the motion control with Auto, Ativadas, Desativadas options', () => {
    const pills = fixture.nativeElement.querySelectorAll('.motion-pill-btn') as NodeListOf<HTMLButtonElement>;
    expect(pills.length).toBe(3);
    expect(pills[0].textContent?.trim()).toBe('Auto');
    expect(pills[1].textContent?.trim()).toBe('Ativadas');
    expect(pills[2].textContent?.trim()).toBe('Desativadas');
  });

  it('switches motion mode and updates active class when pill is clicked', () => {
    const pills = fixture.nativeElement.querySelectorAll('.motion-pill-btn') as NodeListOf<HTMLButtonElement>;

    // Click 'Desativadas'
    pills[2].click();
    fixture.detectChanges();

    expect(motionService.motionMode()).toBe('disabled');
    expect(pills[2].classList.contains('is-active')).toBe(true);
    expect(pills[0].classList.contains('is-active')).toBe(false);

    // Click 'Ativadas'
    pills[1].click();
    fixture.detectChanges();

    expect(motionService.motionMode()).toBe('enabled');
    expect(pills[1].classList.contains('is-active')).toBe(true);
    expect(pills[2].classList.contains('is-active')).toBe(false);
  });
});
