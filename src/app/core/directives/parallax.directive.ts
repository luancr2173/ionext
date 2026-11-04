import {
  Directive,
  ElementRef,
  inject,
  input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ScrollParallaxService } from '../services/scroll-parallax.service';

@Directive({
  selector: '[appParallax]',
  standalone: true,
})
export class ParallaxDirective implements OnInit, OnDestroy, OnChanges {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly parallaxService = inject(ScrollParallaxService);

  readonly speed = input<number>(0.15, { alias: 'appParallaxSpeed' });
  readonly axis = input<'x' | 'y'>('y', { alias: 'appParallaxAxis' });
  readonly maxOffset = input<number>(80, { alias: 'appParallaxMaxOffset' });
  readonly disabled = input<boolean>(false, { alias: 'appParallaxDisabled' });

  private isRegistered = false;

  ngOnInit(): void {
    if (!this.disabled()) {
      this.register();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      if (this.disabled()) {
        this.unregister();
      } else {
        this.register();
      }
      return;
    }

    if (this.isRegistered && (changes['speed'] || changes['axis'] || changes['maxOffset'])) {
      this.parallaxService.updateOptions(this.el.nativeElement, {
        speed: this.speed(),
        axis: this.axis(),
        maxOffset: this.maxOffset(),
      });
    }
  }

  private register(): void {
    if (this.isRegistered) return;

    this.parallaxService.register(this.el.nativeElement, {
      speed: this.speed(),
      axis: this.axis(),
      maxOffset: this.maxOffset(),
    });
    this.isRegistered = true;
  }

  private unregister(): void {
    if (!this.isRegistered) return;

    this.parallaxService.unregister(this.el.nativeElement);
    this.isRegistered = false;
  }

  ngOnDestroy(): void {
    this.unregister();
  }
}

