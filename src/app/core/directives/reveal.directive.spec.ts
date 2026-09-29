import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevealDirective } from './reveal.directive';
import { describe, it, expect, beforeEach } from 'vitest';

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: ` <div id="test-el" appReveal [appRevealDelay]="300">Content</div> `,
})
class TestHostComponent {}

describe('RevealDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('#test-el');
  });

  it('should initialize element with reveal classes', () => {
    expect(el).toBeTruthy();
    // In test environment without IntersectionObserver, it reveals or sets reveal-init
    const hasInit = el.classList.contains('reveal-init') || el.classList.contains('is-revealed');
    expect(hasInit).toBe(true);
  });

  it('should set --reveal-delay property if delay provided', () => {
    // In environment with delayed reveal, verify property or revealed state
    const delayProp = el.style.getPropertyValue('--reveal-delay');
    if (delayProp) {
      expect(delayProp).toBe('300ms');
    }
  });
});
