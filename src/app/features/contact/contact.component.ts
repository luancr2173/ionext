import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
  ElementRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="contact-section section-bg-main" aria-label="Contato e diagnóstico">
      <div class="container contact-container">
        <!-- Header -->
        <header class="contact-header" appReveal>
          <span class="section-label">Próximo Passo</span>
          <h2 class="contact-title">{{ config.title }}</h2>
          <p class="contact-subtitle">{{ config.subtitle }}</p>
        </header>

        <!-- Form Wrapper -->
        <div class="form-wrapper" appReveal [appRevealDelay]="150">
          <!-- Micro-timeline de Expectativa -->
          <div class="expectation-timeline" aria-label="Etapas do diagnóstico">
            <div class="timeline-header">
              <span class="timeline-eyebrow">Como funciona o diagnóstico</span>
              <span class="timeline-meta">3 passos sem custo</span>
            </div>
            <div class="timeline-track">
              @for (step of config.expectationTimeline; track step.step; let idx = $index) {
                <div class="timeline-step">
                  <div class="step-num-badge">
                    <span>{{ step.step }}</span>
                  </div>
                  <div class="step-info">
                    <h4 class="step-title">{{ step.title }}</h4>
                    <p class="step-desc">{{ step.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Dynamic Selected Context Banner (Solution or Product) -->
          @if (contactService.selectedContext(); as ctx) {
            <div class="selected-context-banner" role="status">
              <div class="banner-pill">
                <span class="pill-sparkle" aria-hidden="true">✦</span>
                <span class="pill-text">
                  {{ ctx.type === 'solution' ? 'Solução selecionada:' : 'Produto selecionado:' }}
                  <strong>{{ ctx.name }}</strong>
                </span>
                <button
                  type="button"
                  class="pill-dismiss-btn"
                  (click)="contactService.clearSelectedContext()"
                  [attr.aria-label]="'Desmarcar ' + ctx.name"
                  title="Desmarcar"
                >
                  ✕
                </button>
              </div>
            </div>
          }

          @if (isSuccess()) {
            <div class="feedback-card feedback-success" role="status">
              <div class="feedback-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                  <path
                    d="M8 12L11 15L16 9"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <h3 class="feedback-title">Mensagem Enviada!</h3>
              <p class="feedback-message">{{ feedbackMessage() }}</p>
              <app-button
                variant="secondary"
                size="md"
                label="Enviar outra mensagem"
                (clicked)="resetForm()"
              >
                Enviar outra mensagem
              </app-button>
            </div>
          } @else {
            <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form" novalidate>
              <!-- Anti-Spam Honeypot Field (invisible to normal users) -->
              <div class="honeypot-field" aria-hidden="true">
                <label for="honeypot-website">Website</label>
                <input
                  id="honeypot-website"
                  type="text"
                  formControlName="website"
                  tabindex="-1"
                  autocomplete="off"
                />
              </div>

              @if (errorMessage()) {
                <div class="feedback-card feedback-error" role="alert">
                  <p>{{ errorMessage() }}</p>
                </div>
              }

              <div class="form-grid">
                <!-- Name Field -->
                <div class="form-group">
                  <label for="contact-name" class="form-label">
                    Seu nome <span class="required-star">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    formControlName="name"
                    class="form-input"
                    [class.has-error]="isFieldInvalid('name')"
                    placeholder="Como podemos te chamar?"
                    autocomplete="name"
                    [attr.aria-invalid]="isFieldInvalid('name')"
                    aria-describedby="name-error"
                  />
                  @if (isFieldInvalid('name')) {
                    <span id="name-error" class="error-text"> Por favor, informe seu nome. </span>
                  }
                </div>

                <!-- Company Field -->
                <div class="form-group">
                  <label for="contact-company" class="form-label">
                    Empresa <span class="required-star">*</span>
                  </label>
                  <input
                    id="contact-company"
                    type="text"
                    formControlName="company"
                    class="form-input"
                    [class.has-error]="isFieldInvalid('company')"
                    placeholder="Nome da sua empresa"
                    autocomplete="organization"
                    [attr.aria-invalid]="isFieldInvalid('company')"
                    aria-describedby="company-error"
                  />
                  @if (isFieldInvalid('company')) {
                    <span id="company-error" class="error-text">
                      Por favor, informe sua empresa.
                    </span>
                  }
                </div>

                <!-- Email Field -->
                <div class="form-group">
                  <label for="contact-email" class="form-label">
                    E-mail <span class="required-star">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    inputmode="email"
                    formControlName="email"
                    class="form-input"
                    [class.has-error]="isFieldInvalid('email')"
                    placeholder="seu.nome@empresa.com.br"
                    autocomplete="email"
                    [attr.aria-invalid]="isFieldInvalid('email')"
                    aria-describedby="email-error"
                  />
                  @if (isFieldInvalid('email')) {
                    <span id="email-error" class="error-text">
                      Por favor, insira um e-mail válido.
                    </span>
                  }
                </div>

                <!-- WhatsApp Field -->
                <div class="form-group">
                  <label for="contact-phone" class="form-label">
                    WhatsApp <span class="required-star">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    inputmode="tel"
                    formControlName="phone"
                    class="form-input"
                    [class.has-error]="isFieldInvalid('phone')"
                    placeholder="(61) 99621-3055"
                    autocomplete="tel"
                    (input)="onPhoneInput($event)"
                    [attr.aria-invalid]="isFieldInvalid('phone')"
                    aria-describedby="phone-error"
                  />
                  @if (isFieldInvalid('phone')) {
                    <span id="phone-error" class="error-text">
                      Por favor, insira um WhatsApp válido com DDD.
                    </span>
                  }
                </div>
              </div>

              <!-- Bottlenecks Chips Multi-Select Group -->
              <div class="form-group full-width bottleneck-group" id="bottleneck-group">
                <label class="form-label" id="bottleneck-label">
                  Qual é o maior gargalo no seu funil hoje? <span class="required-star">*</span>
                </label>

                <div
                  class="bottlenecks-chips-grid"
                  role="group"
                  aria-labelledby="bottleneck-label"
                >
                  @for (chip of config.bottlenecks; track chip) {
                    <button
                      type="button"
                      class="chip-button"
                      [class.is-selected]="isBottleneckSelected(chip)"
                      role="checkbox"
                      [attr.aria-checked]="isBottleneckSelected(chip)"
                      (click)="onToggleBottleneck(chip)"
                    >
                      <span class="chip-check" aria-hidden="true">
                        @if (isBottleneckSelected(chip)) {
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M2.5 7L5.5 10L11.5 4"
                              stroke="currentColor"
                              stroke-width="2.2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        } @else {
                          <span class="chip-dot"></span>
                        }
                      </span>
                      <span class="chip-text">{{ chip }}</span>
                    </button>
                  }
                </div>

                @if (bottleneckError()) {
                  <span id="bottleneck-error" class="error-text">
                    Por favor, selecione ao menos um gargalo ou detalhe sua necessidade.
                  </span>
                }

                <!-- Optional Details Field -->
                <div class="optional-details-wrap">
                  <label for="contact-message" class="form-label label-subtle">
                    Quer detalhar mais algum ponto? <span class="optional-text">(Opcional)</span>
                  </label>
                  <textarea
                    id="contact-message"
                    formControlName="message"
                    class="form-textarea"
                    rows="3"
                    placeholder="Quer detalhar mais algum ponto? (Opcional)"
                    (input)="onMessageInput()"
                  ></textarea>
                </div>
              </div>

              <!-- Submit Button & Security Badge -->
              <div class="form-actions">
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [withArrow]="true"
                  [loading]="isLoading()"
                  [disabled]="isLoading()"
                >
                  {{ isLoading() ? 'Enviando...' : 'Solicitar Diagnóstico Preliminar do Funil' }}
                </app-button>

                <!-- Selo de Confidencialidade e LGPD -->
                <div class="security-seal-badge">
                  <span class="seal-icon" aria-hidden="true">🔒</span>
                  <span class="seal-text">
                    Seus dados e processos operacionais são protegidos sob conformidade LGPD e sigilo (NDA).
                  </span>
                </div>
              </div>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly contactService = inject(ContactService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly config = SITE_CONFIG.contact;

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSuccess = signal<boolean>(false);
  protected readonly feedbackMessage = signal<string>('');
  protected readonly errorMessage = signal<string>('');
  protected readonly bottleneckError = signal<boolean>(false);

  protected readonly contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(14)]],
    message: [''], // Optional additional details
    website: [''], // Honeypot
  });

  constructor() {
    effect(() => {
      const msg = this.contactService.prefilledMessage();
      if (msg) {
        this.contactForm.patchValue({ message: msg });
        this.contactForm.get('message')?.markAsDirty();
      }
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  protected isBottleneckSelected(chip: string): boolean {
    return this.contactService.selectedBottlenecks().includes(chip);
  }

  protected onToggleBottleneck(chip: string): void {
    this.contactService.toggleBottleneck(chip);
    this.bottleneckError.set(false);
  }

  protected onMessageInput(): void {
    if (this.bottleneckError()) {
      this.bottleneckError.set(false);
    }
  }

  /**
   * Brazilian phone mask: (11) 99999-9999 or (11) 9999-9999
   */
  protected onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');

    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }

    let formatted = '';
    if (digits.length > 0) {
      formatted = '(' + digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += ') ';
      if (digits.length > 6 && digits.length <= 10) {
        formatted += digits.slice(2, 6) + '-' + digits.slice(6);
      } else if (digits.length > 10) {
        formatted += digits.slice(2, 7) + '-' + digits.slice(7);
      } else {
        formatted += digits.slice(2);
      }
    }

    input.value = formatted;
    this.contactForm.get('phone')?.setValue(formatted, { emitEvent: false });
  }

  async onSubmit(): Promise<void> {
    const hasBottlenecks = this.contactService.selectedBottlenecks().length > 0;
    const extraMessage = this.contactForm.get('message')?.value?.trim() || '';

    if (!hasBottlenecks && !extraMessage) {
      this.bottleneckError.set(true);
    }

    if (this.contactForm.invalid || (!hasBottlenecks && !extraMessage)) {
      this.contactForm.markAllAsTouched();
      this.scrollToFirstInvalidField();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formVal = this.contactForm.value;
    const context = this.contactService.selectedContext();
    const bottlenecks = this.contactService.selectedBottlenecks();

    let composedMessage = '';
    if (context) {
      composedMessage += `[Interesse: ${context.type === 'solution' ? 'Solução sob medida' : 'Produto'} ${context.name}]\n`;
    }
    if (bottlenecks.length > 0) {
      composedMessage += `Gargalos identificados:\n• ${bottlenecks.join('\n• ')}`;
      if (extraMessage) {
        composedMessage += `\n\nDetalhes adicionais:\n${extraMessage}`;
      }
    } else {
      composedMessage += extraMessage;
    }

    const result = await this.contactService.submitContact({
      name: formVal.name,
      company: formVal.company,
      email: formVal.email,
      phone: formVal.phone,
      message: composedMessage,
      website: formVal.website,
    });

    this.isLoading.set(false);

    if (result.success) {
      this.isSuccess.set(true);
      this.feedbackMessage.set(result.message);
    } else {
      this.errorMessage.set(result.message);
    }
  }

  private scrollToFirstInvalidField(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const firstInvalid = this.el.nativeElement.querySelector(
        '.form-input.has-error, #bottleneck-group .error-text',
      ) as HTMLElement;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus?.({ preventScroll: true });
      }
    }, 50);
  }

  protected resetForm(): void {
    this.contactForm.reset();
    this.contactService.clearSelectedContext();
    this.contactService.clearBottlenecks();
    this.bottleneckError.set(false);
    this.isSuccess.set(false);
    this.errorMessage.set('');
  }
}
