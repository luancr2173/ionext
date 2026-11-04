import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatsappMockupComponent } from './whatsapp-mockup.component';
import { MotionService } from '../../../core/services/motion.service';
import { SITE_CONFIG } from '../../../core/config/site.config';
import { describe, it, expect, beforeEach } from 'vitest';

describe('WhatsappMockupComponent', () => {
  let component: WhatsappMockupComponent;
  let fixture: ComponentFixture<WhatsappMockupComponent>;
  let motionService: MotionService;

  beforeEach(async () => {
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
      },
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [WhatsappMockupComponent],
      providers: [MotionService],
    }).compileComponents();

    motionService = TestBed.inject(MotionService);
    fixture = TestBed.createComponent(WhatsappMockupComponent);
    component = fixture.componentInstance;
  });

  it('should create the whatsapp mockup component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all messages in order when animations are disabled', () => {
    motionService.setMotionMode('disabled');
    fixture.detectChanges();

    const expectedMessages = SITE_CONFIG.hero.neoChat.messages;
    expect(component.visibleMessages().length).toBe(expectedMessages.length);

    const bubbles = fixture.nativeElement.querySelectorAll('.wa-bubble:not(.wa-typing-bubble)');
    expect(bubbles.length).toBe(expectedMessages.length);

    expectedMessages.forEach((msg, idx) => {
      const bubbleText = bubbles[idx].querySelector('.wa-bubble-text')?.textContent?.trim();
      expect(bubbleText).toBe(msg.text);
    });
  });

  it('should display bot name and status in header', () => {
    fixture.detectChanges();
    const nameEl = fixture.nativeElement.querySelector('.wa-contact-name');
    const statusEl = fixture.nativeElement.querySelector('.wa-status');

    expect(nameEl?.textContent?.trim()).toBe(SITE_CONFIG.hero.neoChat.botName);
    expect(statusEl?.textContent?.trim()).toContain(SITE_CONFIG.hero.neoChat.status);
  });
});

