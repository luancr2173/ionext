import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomSolutionsComponent } from './custom-solutions.component';
import { ScrollService } from '../../core/services/scroll.service';
import { ContactService } from '../../core/services/contact.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CustomSolutionsComponent', () => {
  let component: CustomSolutionsComponent;
  let fixture: ComponentFixture<CustomSolutionsComponent>;
  let scrollService: ScrollService;
  let contactService: ContactService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSolutionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomSolutionsComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollService);
    contactService = TestBed.inject(ContactService);
    fixture.detectChanges();
  });

  it('should create the custom solutions component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 6 custom solution cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.custom-card');
    expect(cards.length).toBe(6);

    const names = Array.from(cards).map(
      (card: any) => card.querySelector('.custom-item-name')?.textContent?.trim()
    );
    expect(names).toEqual(['Vender', 'Prospectar', 'Conectar', 'Criar', 'Cuidar', 'Diagnosticar']);
  });

  it('should open modal when clicking a solution card (e.g. Vender)', () => {
    const cards = fixture.nativeElement.querySelectorAll('.custom-card');
    const venderCard = cards[0] as HTMLElement;

    venderCard.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.solution-modal-dialog');
    expect(modal).toBeTruthy();

    const title = fixture.nativeElement.querySelector('.modal-solution-title');
    expect(title?.textContent?.trim()).toBe('Vender');

    const headline = fixture.nativeElement.querySelector('.modal-solution-headline');
    expect(headline?.textContent).toContain('Agente de vendas completo');

    const overview = fixture.nativeElement.querySelector('.modal-overview-text');
    expect(overview?.textContent).toContain('Um agente de IA consultivo');
  });

  it('should close modal when close button is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('.custom-card');
    cards[0].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.solution-modal-dialog')).toBeTruthy();

    const closeBtn = fixture.nativeElement.querySelector('.modal-close-button');
    closeBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.solution-modal-dialog')).toBeFalsy();
  });

  it('should close modal on Escape key press', () => {
    const cards = fixture.nativeElement.querySelectorAll('.custom-card');
    cards[0].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.solution-modal-dialog')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.solution-modal-dialog')).toBeFalsy();
  });

  it('should prefill message and scroll to contact when requesting a solution', () => {
    const scrollSpy = vi.spyOn(scrollService, 'scrollTo');
    const messageSpy = vi.spyOn(contactService, 'setPrefilledMessage');

    const cards = fixture.nativeElement.querySelectorAll('.custom-card');
    cards[0].click(); // Open Vender
    fixture.detectChanges();

    const primaryBtn = fixture.nativeElement.querySelector('.modal-btn-primary');
    expect(primaryBtn).toBeTruthy();

    primaryBtn.click();
    fixture.detectChanges();

    expect(messageSpy).toHaveBeenCalledWith(expect.stringContaining('Vender'));
    expect(scrollSpy).toHaveBeenCalledWith('#contato');
    expect(fixture.nativeElement.querySelector('.solution-modal-dialog')).toBeFalsy();
  });
});
