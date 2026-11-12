import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { PORTFOLIO_ITEMS } from '../../core/config/site.config';
import { PortfolioPageComponent } from './portfolio.component';

describe('PortfolioPageComponent', () => {
  let fixture: ComponentFixture<PortfolioPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PortfolioPageComponent);
    fixture.detectChanges();
  });

  it('lista os três modelos com link direto (fora do router) em nova aba', () => {
    const projects = fixture.nativeElement.querySelectorAll('.project') as NodeListOf<HTMLElement>;
    expect(projects).toHaveLength(PORTFOLIO_ITEMS.length);
    PORTFOLIO_ITEMS.forEach((item, i) => {
      const open = projects[i].querySelector('.pill--solid') as HTMLAnchorElement;
      expect(open.getAttribute('href')).toBe(item.url);
      expect(open.getAttribute('target')).toBe('_blank');
      expect(open.getAttribute('rel')).toContain('noopener');
      expect(open.hasAttribute('ng-reflect-router-link')).toBe(false);
    });
  });

  it('cada modelo tem um WhatsApp com a mensagem do modelo e deixa claro que são demonstrações', () => {
    const wa = fixture.nativeElement.querySelectorAll('.project-actions .pill:not(.pill--solid)') as NodeListOf<HTMLAnchorElement>;
    PORTFOLIO_ITEMS.forEach((item, i) => {
      expect(decodeURIComponent(wa[i].href)).toContain(item.whatsappMessage);
    });
    expect(fixture.nativeElement.querySelector('.portfolio-note').textContent).toContain('não sites de clientes');
  });

  it('título da página com espaço entre as palavras', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent!.replace(/\s+/g, ' ').trim()).toBe('Sites para clínicas com cara de marca grande.');
  });
});
