import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONFIG, IONEXT_WHATSAPP_NUMBER } from '../config/site.config';

export interface ServiceQuoteRequest {
  name: string;
  subtitle?: string;
  description?: string;
  highlight?: string;
  id?: string;
}

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

export interface SelectedContext {
  type: 'solution' | 'product';
  name: string;
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly prefilledMessage = signal<string>('');
  readonly selectedContext = signal<SelectedContext | null>(null);
  readonly selectedBottlenecks = signal<string[]>([]);

  setPrefilledMessage(message: string): void {
    this.prefilledMessage.set(message);
  }

  selectSolution(name: string, id: string): void {
    this.selectedContext.set({ type: 'solution', name, id });
  }

  selectProduct(name: string, id: string): void {
    this.selectedContext.set({ type: 'product', name, id });
    const productBottleneckMap: Record<string, string> = {
      atender: 'Demora para qualificar leads',
      agendar: 'Perda de reuniões por no-show',
      acompanhar: 'Leads esquecidos no follow-up',
      enxergar: 'Outro gargalo operacional',
    };
    const mapped =
      productBottleneckMap[id.toLowerCase()] || productBottleneckMap[name.toLowerCase()];
    if (mapped) {
      this.selectedBottlenecks.update((current) => {
        return current.includes(mapped) ? current : [...current, mapped];
      });
    }
  }

  toggleBottleneck(bottleneck: string): void {
    this.selectedBottlenecks.update((current) => {
      if (current.includes(bottleneck)) {
        return current.filter((b) => b !== bottleneck);
      }
      return [...current, bottleneck];
    });
  }

  clearSelectedContext(): void {
    this.selectedContext.set(null);
  }

  clearBottlenecks(): void {
    this.selectedBottlenecks.set([]);
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
          message: 'Revise os dados no WhatsApp e confirme o envio por lá.',
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

  /**
   * Constrói a mensagem personalizada para solicitação de orçamento do serviço via WhatsApp.
   * Contém:
   * 1. Saudação cordial
   * 2. Nome do serviço selecionado
   * 3. Breve resumo e sua finalidade
   * 4. Solicitação formal de orçamento
   */
  buildServiceQuoteMessage(service: ServiceQuoteRequest): string {
    const greeting = 'Olá! Gostaria de mais informações e um orçamento da Ionext.';
    const serviceName = service.name.trim();
    const summary = (service.subtitle || service.description || service.highlight || '').trim();

    return (
      `${greeting}\n\n` +
      `*Serviço de interesse:* ${serviceName}\n` +
      `*Finalidade:* ${summary}\n\n` +
      `Poderiam me passar uma proposta e detalhes de orçamento para essa solução?`
    );
  }

  /**
   * Retorna a URL do WhatsApp com o número comercial oficial e texto codificado via encodeURIComponent().
   * Formato: https://wa.me/5561998145516?text=MENSAGEM_CODIFICADA
   */
  getServiceQuoteWhatsAppUrl(service: ServiceQuoteRequest): string {
    const message = this.buildServiceQuoteMessage(service);
    const encoded = encodeURIComponent(message);
    const phone = IONEXT_WHATSAPP_NUMBER || SITE_CONFIG.contact.whatsappNumber;
    return `https://wa.me/${phone}?text=${encoded}`;
  }

  /**
   * Redireciona o usuário para o WhatsApp oficial em uma nova aba com a mensagem pré-preenchida.
   */
  openServiceQuoteWhatsApp(service: ServiceQuoteRequest): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const targetUrl = this.getServiceQuoteWhatsAppUrl(service);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
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
    const phone = IONEXT_WHATSAPP_NUMBER || SITE_CONFIG.contact.whatsappNumber;
    const targetUrl = `https://wa.me/${phone}?text=${encoded}`;
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
