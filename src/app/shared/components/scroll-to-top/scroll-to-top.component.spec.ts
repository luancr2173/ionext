import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollToTopComponent } from './scroll-to-top.component';
import { ScrollService } from '../../../core/services/scroll.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ScrollToTopComponent', () => {
  let component: ScrollToTopComponent;
  let fixture: ComponentFixture<ScrollToTopComponent>;
  let scrollService: ScrollService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollToTopComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollToTopComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollService);
    fixture.detectChanges();
  });

  it('should create the scroll-to-top component', () => {
    expect(component).toBeTruthy();
  });

  it('should not have .is-visible class when scrollY <= 400', () => {
    scrollService.scrollY.set(0);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.scroll-to-top-btn');
    expect(btn.classList.contains('is-visible')).toBe(false);
    expect(btn.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have .is-visible class when scrollY > 400', () => {
    scrollService.scrollY.set(500);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.scroll-to-top-btn');
    expect(btn.classList.contains('is-visible')).toBe(true);
    expect(btn.getAttribute('aria-hidden')).toBe('false');
  });

  it('should call scrollToTop when clicked', () => {
    const scrollSpy = vi.spyOn(scrollService, 'scrollToTop');
    scrollService.scrollY.set(600);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.scroll-to-top-btn') as HTMLButtonElement;
    btn.click();

    expect(scrollSpy).toHaveBeenCalled();
  });
});
