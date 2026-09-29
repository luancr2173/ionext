import { TestBed } from '@angular/core/testing';
import { ContactService, ContactPayload } from './contact.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContactService],
    });
    service = TestBed.inject(ContactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reject submission if required fields are missing', async () => {
    const invalidPayload: ContactPayload = {
      name: '',
      company: '',
      email: '',
      phone: '',
      message: '',
    };

    const result = await service.submitContact(invalidPayload);
    expect(result.success).toBe(false);
    expect(result.message).toContain('obrigatórios');
  });

  it('should trap spam bots via honeypot field without sending', async () => {
    const botPayload: ContactPayload = {
      name: 'Spam Bot',
      company: 'Spam Inc',
      email: 'bot@spam.com',
      phone: '(11) 99999-9999',
      message: 'Cheap crypto loans',
      website: 'https://spam-link.com',
    };

    const result = await service.submitContact(botPayload);
    // Returns soft success to deceive the bot scraper
    expect(result.success).toBe(true);
    expect(result.channel).toBeUndefined();
  });

  it('should route valid contact to WhatsApp by default', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const validPayload: ContactPayload = {
      name: 'Carlos Silva',
      company: 'Empresa Alpha',
      email: 'carlos@alpha.com.br',
      phone: '(11) 98765-4321',
      message: 'Gostaria de agendar uma reunião sobre o produto Atender.',
    };

    const result = await service.submitContact(validPayload);
    expect(result.success).toBe(true);
    expect(result.channel).toBe('whatsapp');
    expect(openSpy).toHaveBeenCalled();

    openSpy.mockRestore();
  });

  it('should support switching channel to mailto', async () => {
    service.channel = 'mailto';
    const validPayload: ContactPayload = {
      name: 'Mariana Costa',
      company: 'Beta Log',
      email: 'mariana@betalog.com',
      phone: '(21) 91234-5678',
      message: 'Dúvidas sobre o plano Profissional.',
    };

    const result = await service.submitContact(validPayload);
    expect(result.success).toBe(true);
    expect(result.channel).toBe('mailto');
  });
});
