import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { describe, it, expect, beforeEach } from 'vitest';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <app-button id="projected-btn" variant="primary">Ver serviços</app-button>
    <app-button
      id="label-btn"
      variant="secondary"
      label="Falar com a Ionext"
      href="#contato"
    ></app-button>
  `,
})
class TestHostComponent {}

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render projected content correctly', () => {
    const el = fixture.nativeElement.querySelector('#projected-btn');
    expect(el.textContent).toContain('Ver serviços');
  });

  it('should render label input correctly and render link element when href is provided', () => {
    const el = fixture.nativeElement.querySelector('#label-btn');
    expect(el.textContent).toContain('Falar com a Ionext');
    const link = el.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('#contato');
  });
});
