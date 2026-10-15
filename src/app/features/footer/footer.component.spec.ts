import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { IONEXT_WHATSAPP_URL } from '../../core/config/site.config';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

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
});
