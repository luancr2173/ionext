import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessComponent } from './process.component';
import { ScrollService } from '../../core/services/scroll.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProcessComponent', () => {
  let component: ProcessComponent;
  let fixture: ComponentFixture<ProcessComponent>;
  let scrollService: ScrollService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollService);
    fixture.detectChanges();
  });

  it('should create the process component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 3 phase navigation tabs', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.carousel-tab-btn');
    expect(tabs.length).toBe(3);

    const firstTab = tabs[0];
    expect(firstTab.textContent).toContain('01');
    expect(firstTab.textContent).toContain('Diagnóstico');
    expect(firstTab.classList.contains('is-active')).toBe(true);
  });

  it('should navigate to next phase when nextStep is called', () => {
    expect(component.activeStepIndex()).toBe(0);

    component.nextStep();
    fixture.detectChanges();

    expect(component.activeStepIndex()).toBe(1);
    expect(component['activeStep']().title).toBe('Implementação');

    component.nextStep();
    fixture.detectChanges();

    expect(component.activeStepIndex()).toBe(2);
    expect(component['activeStep']().title).toBe('Operação');

    // Should not exceed maximum step
    component.nextStep();
    expect(component.activeStepIndex()).toBe(2);
  });

  it('should navigate to previous phase when prevStep is called', () => {
    component.goToStep(2);
    fixture.detectChanges();
    expect(component.activeStepIndex()).toBe(2);

    component.prevStep();
    fixture.detectChanges();
    expect(component.activeStepIndex()).toBe(1);

    component.prevStep();
    fixture.detectChanges();
    expect(component.activeStepIndex()).toBe(0);

    // Should not go below 0
    component.prevStep();
    expect(component.activeStepIndex()).toBe(0);
  });

  it('should switch slide when clicking on a tab button', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.carousel-tab-btn');
    const thirdTab = tabs[2] as HTMLButtonElement;

    thirdTab.click();
    fixture.detectChanges();

    expect(component.activeStepIndex()).toBe(2);
    expect(thirdTab.classList.contains('is-active')).toBe(true);
  });

  it('should trigger scroll to #contato on last phase CTA click', () => {
    const scrollSpy = vi.spyOn(scrollService, 'scrollTo');
    component.goToStep(2); // Last phase
    fixture.detectChanges();

    const ctaBtn = fixture.nativeElement.querySelector('.btn-cta') as HTMLButtonElement;
    expect(ctaBtn).toBeTruthy();
    expect(ctaBtn.textContent).toContain('Iniciar Projeto');

    ctaBtn.click();
    expect(scrollSpy).toHaveBeenCalledWith('#contato');
  });
});
