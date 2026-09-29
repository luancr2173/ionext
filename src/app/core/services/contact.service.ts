import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONFIG } from '../config/site.config';

export interface ContactPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  website?: string; // Honeypot anti-spam field
}

export interface ContactResult {
  success: boolean;
  message: string;
  channel?: 'whatsapp' | 'mailto' | 'rest';
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly prefilledMessage = signal<string>('');

  setPrefilledMessage(message: string): void {
    this.prefilledMessage.set(message);
  }

  /**
   * Submission channel strategy:
   * - 'whatsapp': opens wa.me with pre-formatted greeting and lead details (default)
   * - 'mailto': opens user default mail client with formatted subject and body
   * - 'rest': sends JSON POST to backend API (e.g. Spring Boot)
   */
  channel: 'whatsapp' | 'mailto' | 'rest' = 'whatsapp';

  /**
   * Future REST backend endpoint URL (Spring Boot).
   */
  apiEndpoint = '/api/v1/leads';

  async submitContact(payload: ContactPayload): Promise<ContactResult> {
    // 1. Anti-spam honeypot verification
    // Bots usually fill out every input including hidden ones
    if (payload.website && payload.website.trim().length > 0) {
      // Silently pretend success to deceive bot scrapers
      return {
        success: true,
        message: 'Mensagem recebida com sucesso.',
      };
    }

    // 2. Validate essential fields
    if (!payload.name.trim() || !payload.email.trim() || !payload.message.trim()) {
      return {
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios.',
      };
    }

    try {
      if (this.channel === 'whatsapp') {
        this.openWhatsApp(payload);
        return {
          success: true,
          message: 'Redirecionando para o WhatsApp da Ionext...',
          channel: 'whatsapp',
        };
      } else if (this.channel === 'mailto') {
        this.openMailto(payload);
        return {
          success: true,
          message: 'Abrindo seu cliente de e-mail...',
          channel: 'mailto',
        };
      } else {
        // Ready for Spring Boot REST API
        return await this.submitToRestBackend(payload);
      }
    } catch {
      return {
        success: false,
        message: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.',
      };
    }
  }

  private openWhatsApp(payload: ContactPayload): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const formattedText =
      `*Solicitação de Contato — Ionext*\n\n` +
      `*Nome:* ${payload.name.trim()}\n` +
      `*Empresa:* ${payload.company.trim() || 'Não informada'}\n` +
      `*E-mail:* ${payload.email.trim()}\n` +
      `*Telefone/WhatsApp:* ${payload.phone.trim()}\n\n` +
      `*Mensagem:*\n${payload.message.trim()}`;

    const encoded = encodeURIComponent(formattedText);
    const targetUrl = `https://wa.me/${SITE_CONFIG.contact.whatsappNumber}?text=${encoded}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }

  private openMailto(payload: ContactPayload): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const subject = encodeURIComponent(`Contato Ionext — ${payload.company || payload.name}`);
    const body = encodeURIComponent(
      `Nome: ${payload.name}\n` +
        `Empresa: ${payload.company}\n` +
        `E-mail: ${payload.email}\n` +
        `Telefone: ${payload.phone}\n\n` +
        `Mensagem:\n${payload.message}\n`,
    );

    window.location.href = `mailto:${SITE_CONFIG.contact.email}?subject=${subject}&body=${body}`;
  }

  private async submitToRestBackend(payload: ContactPayload): Promise<ContactResult> {
    // Standard fetch implementation compatible with Spring Boot @RequestBody ContactDTO
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        company: payload.company,
        email: payload.email,
        phone: payload.phone,
        message: payload.message,
        source: 'landing-page',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`REST submission failed with status ${response.status}`);
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso! Nossa equipe entrará em contato.',
      channel: 'rest',
    };
  }
}
