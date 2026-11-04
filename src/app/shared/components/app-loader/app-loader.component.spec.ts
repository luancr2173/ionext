import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppLoaderComponent, LOADER_STORAGE_KEY } from './app-loader.component';
import { MotionService } from '../../../core/services/motion.service';

describe('AppLoaderComponent', () => {
  let component: AppLoaderComponent;
  let fixture: ComponentFixture<AppLoaderComponent>;
  let motionService: MotionService;
  let store: Map<string, string>;

  beforeEach(async () => {
    store = new Map<string, string>();
    const mockSessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [AppLoaderComponent],
      providers: [MotionService],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLoaderComponent);
    component = fixture.componentInstance;
    motionService = TestBed.inject(MotionService);
  });

  afterEach(() => {
    store.clear();
    vi.restoreAllMocks();
  });

  it('should create the loader component', () => {
    expect(component).toBeTruthy();
  });

  it('should start loading when session storage is empty and motion is enabled', () => {
    motionService.setMotionMode('enabled');
    fixture.detectChanges();

    expect(store.get(LOADER_STORAGE_KEY)).toBe('true');
    expect(component.isVisible()).toBe(true);
  });

  it('should skip loader if already seen in current session', () => {
    store.set(LOADER_STORAGE_KEY, 'true');
    fixture.detectChanges();

    expect(component.isVisible()).toBe(false);
  });

  it('should skip loader if motion service has animations disabled', () => {
    motionService.setMotionMode('disabled');
    fixture.detectChanges();

    expect(component.isVisible()).toBe(false);
  });
});

