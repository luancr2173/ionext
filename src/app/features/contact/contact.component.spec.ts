import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import { ContactService } from '../../core/services/contact.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;
  let contactService: ContactService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [ContactService],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    contactService = TestBed.inject(ContactService);
    fixture.detectChanges();
  });

  it('should initialize with an empty invalid form', () => {
    expect(component).toBeTruthy();
    // @ts-expect-error accessing protected for testing
    expect(component.contactForm.valid).toBe(false);
  });

  it('should format Brazilian phone number automatically on input', () => {
    const input = fixture.nativeElement.querySelector('#contact-phone') as HTMLInputElement;
    input.value = '11987654321';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('(11) 98765-4321');
  });

  it('should call ContactService on valid form submission', async () => {
    const submitSpy = vi
      .spyOn(contactService, 'submitContact')
      .mockResolvedValue({ success: true, message: 'Sucesso!' });

    // @ts-expect-error accessing protected for testing
    const form = component.contactForm;
    form.setValue({
      name: 'Ana Paula',
      company: 'Tech Solutions',
      email: 'ana@tech.com',
      phone: '(11) 99887-7665',
      message: 'Precisamos de IA para atender no WhatsApp 24/7.',
      website: '',
    });

    expect(form.valid).toBe(true);

    await component.onSubmit();
    expect(submitSpy).toHaveBeenCalledWith({
      name: 'Ana Paula',
      company: 'Tech Solutions',
      email: 'ana@tech.com',
      phone: '(11) 99887-7665',
      message: 'Precisamos de IA para atender no WhatsApp 24/7.',
      website: '',
    });

    submitSpy.mockRestore();
  });

  it('should render the expectation timeline with 3 steps', () => {
    const steps = fixture.nativeElement.querySelectorAll('.timeline-step');
    expect(steps.length).toBe(3);
  });

  it('should toggle bottleneck chips when clicked', () => {
    const chipBtns = fixture.nativeElement.querySelectorAll('.chip-button');
    expect(chipBtns.length).toBe(5);

    const firstChip = chipBtns[0] as HTMLButtonElement;
    firstChip.click();
    fixture.detectChanges();

    expect(contactService.selectedBottlenecks().length).toBe(1);
    expect(firstChip.classList.contains('is-selected')).toBe(true);

    firstChip.click();
    fixture.detectChanges();
    expect(contactService.selectedBottlenecks().length).toBe(0);
    expect(firstChip.classList.contains('is-selected')).toBe(false);
  });

  it('should display selected solution banner and allow dismissing it', () => {
    contactService.selectSolution('Vender', 'vender');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.selected-context-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Solução selecionada:');
    expect(banner.textContent).toContain('Vender');

    const dismissBtn = fixture.nativeElement.querySelector('.pill-dismiss-btn') as HTMLButtonElement;
    dismissBtn.click();
    fixture.detectChanges();

    expect(contactService.selectedContext()).toBeNull();
    const bannerAfter = fixture.nativeElement.querySelector('.selected-context-banner');
    expect(bannerAfter).toBeNull();
  });
});

