import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ContactService } from '../../core/services/contact.service';
import { PlansComponent } from './plans.component';

describe('PlansComponent', () => {
  let fixture: ComponentFixture<PlansComponent>;
  let contactService: ContactService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlansComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlansComponent);
    contactService = TestBed.inject(ContactService);
    fixture.detectChanges();
  });

  it('opens WhatsApp with the selected plan details for each plan CTA', () => {
    const openWhatsAppSpy = vi.spyOn(contactService, 'openServiceQuoteWhatsApp');
    const buttons = fixture.nativeElement.querySelectorAll(
      '.plan-cta app-button button, .plan-cta app-button a',
    ) as NodeListOf<HTMLButtonElement | HTMLAnchorElement>;

    expect(buttons).toHaveLength(SITE_CONFIG.plans.items.length);

    buttons.forEach((button, index) => button.click());

    expect(openWhatsAppSpy).toHaveBeenCalledTimes(SITE_CONFIG.plans.items.length);
    SITE_CONFIG.plans.items.forEach((plan, index) => {
      expect(openWhatsAppSpy).toHaveBeenNthCalledWith(index + 1, {
        name: `Plano ${plan.name}`,
        subtitle: plan.description,
        description: plan.pricingModel,
        highlight: plan.target,
        id: plan.id,
      });
    });
  });
});
