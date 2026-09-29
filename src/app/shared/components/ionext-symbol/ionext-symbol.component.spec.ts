import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonextSymbolComponent } from './ionext-symbol.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('IonextSymbolComponent', () => {
  let component: IonextSymbolComponent;
  let fixture: ComponentFixture<IonextSymbolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonextSymbolComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IonextSymbolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the 4 geometric parts of the symbol', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dot = el.querySelector('.symbol-dot');
    const stem = el.querySelector('.symbol-stem');
    const curve = el.querySelector('.symbol-curve');
    const arrow = el.querySelector('.symbol-arrow');

    expect(dot).toBeTruthy();
    expect(stem).toBeTruthy();
    expect(curve).toBeTruthy();
    expect(arrow).toBeTruthy();
  });

  it('should apply mode classes properly', () => {
    fixture.componentRef.setInput('mode', 'hero');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.symbol-wrapper');
    expect(wrapper.classList.contains('mode-hero')).toBe(true);

    fixture.componentRef.setInput('mode', 'footer');
    fixture.detectChanges();
    expect(wrapper.classList.contains('mode-footer')).toBe(true);
  });
});
