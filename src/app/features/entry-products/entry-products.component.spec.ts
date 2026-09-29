import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntryProductsComponent } from './entry-products.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EntryProductsComponent', () => {
  let component: EntryProductsComponent;
  let fixture: ComponentFixture<EntryProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryProductsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntryProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the entry products component', () => {
    expect(component).toBeTruthy();
  });

  it('should not contain product index numbers (01, 02, etc.) in product names', () => {
    const productIndexEls = fixture.nativeElement.querySelectorAll('.product-index');
    expect(productIndexEls.length).toBe(0);

    const productNames = fixture.nativeElement.querySelectorAll('.product-name');
    expect(productNames.length).toBeGreaterThan(0);

    productNames.forEach((nameEl: HTMLElement) => {
      // Should not start with "01", "02", etc.
      expect(nameEl.textContent?.trim()).not.toMatch(/^0\d/);
    });
  });
});
