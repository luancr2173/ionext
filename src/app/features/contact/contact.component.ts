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

        <!-- Form Container -->
        <div class="form-wrapper" appReveal [appRevealDelay]="150">
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
                    E-mail corporativo <span class="required-star">*</span>
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
                    placeholder="(11) 99999-9999"
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

              <!-- Message Field -->
              <div class="form-group full-width">
                <label for="contact-message" class="form-label">
                  Qual é o maior gargalo no seu funil hoje? <span class="required-star">*</span>
                </label>
                <textarea
                  id="contact-message"
                  formControlName="message"
                  class="form-textarea"
                  [class.has-error]="isFieldInvalid('message')"
                  rows="4"
                  placeholder="Ex: Demoramos para qualificar leads que chegam pelo site, ou a equipe perde muito tempo no follow-up manual..."
                  [attr.aria-invalid]="isFieldInvalid('message')"
                  aria-describedby="message-error"
                ></textarea>
                @if (isFieldInvalid('message')) {
                  <span id="message-error" class="error-text">
                    Por favor, detalhe brevemente sua necessidade (mínimo de 10 caracteres).
                  </span>
                }
              </div>

              <!-- Submit Button -->
              <div class="form-actions">
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [label]="isLoading() ? 'Enviando...' : 'Solicitar diagnóstico gratuito'"
                  [withArrow]="true"
                  [loading]="isLoading()"
                  [disabled]="isLoading()"
                >
                  {{ isLoading() ? 'Enviando...' : 'Solicitar diagnóstico gratuito' }}
                </app-button>
                <p class="privacy-note">Seus dados estão protegidos. Não enviamos spam.</p>
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
  private readonly contactService = inject(ContactService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly config = SITE_CONFIG.contact;

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSuccess = signal<boolean>(false);
  protected readonly feedbackMessage = signal<string>('');
  protected readonly errorMessage = signal<string>('');

  protected readonly contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(14)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
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

  /**
   * Simple Brazilian phone mask: (11) 99999-9999 or (11) 9999-9999
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
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.scrollToFirstInvalidField();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formVal = this.contactForm.value;

    const result = await this.contactService.submitContact({
      name: formVal.name,
      company: formVal.company,
      email: formVal.email,
      phone: formVal.phone,
      message: formVal.message,
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
        '.form-input.has-error, .form-textarea.has-error',
      ) as HTMLElement;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus({ preventScroll: true });
      }
    }, 50);
  }

  protected resetForm(): void {
    this.contactForm.reset();
    this.isSuccess.set(false);
    this.errorMessage.set('');
  }
}
