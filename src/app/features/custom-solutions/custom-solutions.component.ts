import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  HostListener,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONFIG, CustomSolutionItem } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ScrollService } from '../../core/services/scroll.service';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-custom-solutions',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="custom-section section-bg-alt" aria-label="Soluções sob medida">
      <div class="container custom-container">
        <!-- Section Header -->
        <header class="section-header" appReveal>
          <span class="section-label">Tailor-made</span>
          <h2 class="section-title">
            <span class="masked-title-inner">{{ config.title }}</span>
          </h2>
          <p class="section-subtitle">{{ config.subtitle }}</p>
          <p class="section-hint">
            <span class="hint-bullet" aria-hidden="true">✦</span>
            Clique em cada card para abrir o detalhamento completo da solução.
          </p>
        </header>

        <!-- 3x2 Grid of Clickable Cards -->
        <div class="custom-grid">
          @for (item of config.items; track item.id; let idx = $index) {
            <article
              class="custom-card"
              role="button"
              tabindex="0"
              appReveal
              [appRevealDelay]="idx * 90"
              [attr.aria-label]="'Abrir detalhes da solução: ' + item.name"
              [attr.aria-haspopup]="'dialog'"
              (click)="openSolution(item)"
              (keydown.enter)="openSolution(item)"
              (keydown.space)="openSolution(item); $event.preventDefault()"
            >
              <!-- Card Top Bar: Badge + Icon -->
              <div class="card-top-bar">
                <span class="card-badge">{{ item.stepNumber }} · {{ item.badge }}</span>
                <div class="card-icon" aria-hidden="true">
                  @switch (item.id) {
                    @case ('vender') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    }
                    @case ('prospectar') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    }
                    @case ('conectar') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="6" height="6" rx="1.5"></rect>
                        <rect x="16" y="2" width="6" height="6" rx="1.5"></rect>
                        <rect x="9" y="16" width="6" height="6" rx="1.5"></rect>
                        <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
                        <line x1="12" y1="13" x2="12" y2="16"></line>
                      </svg>
                    }
                    @case ('criar') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"></path>
                      </svg>
                    }
                    @case ('cuidar') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    }
                    @case ('diagnosticar') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                    }
                  }
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-main">
                <h3 class="custom-item-name">{{ item.name }}</h3>
                <p class="custom-item-description">{{ item.description }}</p>
              </div>

              <!-- Card Bottom Action Indicator -->
              <div class="card-action-row">
                <span class="action-text">Ver como funciona</span>
                <span class="action-arrow" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </article>
          }
        </div>
      </div>

      <!-- Popup / Modal Dialog -->
      @if (selectedSolution(); as item) {
        <div
          class="solution-modal-backdrop"
          (click)="closeSolution()"
          role="presentation"
        >
          <div
            class="solution-modal-dialog"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'modal-title-' + item.id"
            [attr.aria-describedby]="'modal-desc-' + item.id"
            (click)="$event.stopPropagation()"
          >
            <!-- Modal Top Bar -->
            <div class="modal-top-bar">
              <div class="modal-badges-group">
                <span class="modal-pill-tag">Tailor-made · Sob Medida</span>
                <span class="modal-pill-step">{{ item.stepNumber }} · {{ item.badge }}</span>
              </div>

              <button
                type="button"
                class="modal-close-button"
                aria-label="Fechar pop-up"
                (click)="closeSolution()"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Modal Content Scroll Area -->
            <div class="modal-scroll-area">
              <!-- Hero Section -->
              <div class="modal-hero">
                <div class="modal-icon-bubble" aria-hidden="true">
                  @switch (item.id) {
                    @case ('vender') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    }
                    @case ('prospectar') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    }
                    @case ('conectar') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="6" height="6" rx="1.5"></rect>
                        <rect x="16" y="2" width="6" height="6" rx="1.5"></rect>
                        <rect x="9" y="16" width="6" height="6" rx="1.5"></rect>
                        <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
                        <line x1="12" y1="13" x2="12" y2="16"></line>
                      </svg>
                    }
                    @case ('criar') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"></path>
                      </svg>
                    }
                    @case ('cuidar') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    }
                    @case ('diagnosticar') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                    }
                  }
                </div>

                <div class="modal-hero-headings">
                  <h3 [id]="'modal-title-' + item.id" class="modal-solution-title">{{ item.name }}</h3>
                  <p class="modal-solution-headline">{{ item.detailedTitle }}</p>
                </div>
              </div>

              <!-- Section: O que é -->
              <div class="modal-section-card">
                <span class="sub-label">Visão Geral</span>
                <h4 class="sub-heading">O que é a solução {{ item.name }}</h4>
                <p [id]="'modal-desc-' + item.id" class="modal-overview-text">
                  {{ item.detailedDescription }}
                </p>
              </div>

              <!-- Section: Como funciona na prática -->
              <div class="modal-section">
                <span class="sub-label">Etapas de Execução</span>
                <h4 class="sub-heading">Como funciona na prática</h4>
                <div class="modal-steps-grid">
                  @for (step of item.howItWorks; track step.title; let sIdx = $index) {
                    <div class="modal-step-item">
                      <div class="step-num-pill">0{{ sIdx + 1 }}</div>
                      <div class="step-text-wrap">
                        <h5 class="step-title">{{ step.title }}</h5>
                        <p class="step-desc">{{ step.description }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Section: Entregáveis & Benefícios -->
              <div class="modal-dual-grid">
                <div class="modal-dual-col">
                  <span class="sub-label">Escopo</span>
                  <h4 class="sub-heading">Capacidades & Entregáveis</h4>
                  <ul class="modal-checklist">
                    @for (d of item.deliverables; track d) {
                      <li class="checklist-item">
                        <span class="check-icon" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </span>
                        <span>{{ d }}</span>
                      </li>
                    }
                  </ul>
                </div>

                <div class="modal-dual-col">
                  <span class="sub-label">Resultados</span>
                  <h4 class="sub-heading">Impacto no Negócio</h4>
                  <ul class="modal-impact-list">
                    @for (b of item.benefits; track b) {
                      <li class="impact-item">
                        <span class="impact-dot" aria-hidden="true">✦</span>
                        <span>{{ b }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>

              <!-- Section: Integrations -->
              @if (item.integrations && item.integrations.length > 0) {
                <div class="modal-section integrations-section">
                  <span class="sub-label">Conectividade</span>
                  <h4 class="sub-heading">Integrações & Ecossistema</h4>
                  <div class="integrations-cloud">
                    @for (tool of item.integrations; track tool) {
                      <span class="integration-chip">{{ tool }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Modal Bottom Actions -->
            <div class="modal-actions-bar">
              <button
                type="button"
                class="modal-btn-secondary"
                (click)="closeSolution()"
              >
                Fechar
              </button>

              <button
                type="button"
                class="modal-btn-primary"
                (click)="requestSolution(item)"
              >
                <span>Quero essa solução</span>
                <span class="btn-arrow" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: './custom-solutions.component.scss',
})
export class CustomSolutionsComponent implements OnDestroy {
  protected readonly config = SITE_CONFIG.customSolutions;
  protected readonly selectedSolution = signal<CustomSolutionItem | null>(null);

  private readonly scrollService = inject(ScrollService);
  private readonly contactService = inject(ContactService);
  private readonly platformId = inject(PLATFORM_ID);

  @HostListener('document:keydown.escape')
  protected onEscapePress(): void {
    if (this.selectedSolution()) {
      this.closeSolution();
    }
  }

  protected openSolution(item: CustomSolutionItem): void {
    this.selectedSolution.set(item);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.add('is-modal-open');
    }
  }

  protected closeSolution(): void {
    this.selectedSolution.set(null);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.remove('is-modal-open');
    }
  }

  protected requestSolution(item: CustomSolutionItem): void {
    this.contactService.selectSolution(item.name, item.id);
    this.closeSolution();
    this.scrollService.scrollTo('#contato');
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.remove('is-modal-open');
    }
  }
}
