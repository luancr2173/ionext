import { Injectable, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SITE_CONFIG } from '../config/site.config';

/**
 * SEO por rota. O index.html traz as tags da home; a cada navegação este serviço troca a
 * descrição, o canonical, o og:url e os títulos/descrições de Open Graph e Twitter pela
 * página atual. Sem isso, todas as páginas declaravam canonical = home e o Google podia
 * tratar Serviços, Planos etc. como cópias da home.
 *
 * O título da aba vem do `title` da rota (TitleStrategy do Angular); a descrição vem de
 * `data.description`; `data.noindex` marca a página como não indexável (404).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Domínio sem barra no fim (ex.: https://ionext.com.br). */
  private readonly origin = SITE_CONFIG.brand.domain.replace(/\/+$/, '');

  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.apply(e.urlAfterRedirects));
  }

  private apply(url: string): void {
    let r = this.route;
    while (r.firstChild) r = r.firstChild;
    const data = r.snapshot.data as { description?: string; noindex?: boolean };

    // caminho sem query (?ramo=...) nem âncora: o canonical é a página, não o filtro
    const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
    const canonical = `${this.origin}${path || '/'}`;
    // título da rota, não o da aba: no NavigationEnd a aba ainda mostra a página anterior
    const pageTitle = r.snapshot.title ?? this.title.getTitle();

    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
      this.meta.updateTag({ property: 'og:description', content: data.description });
      this.meta.updateTag({ name: 'twitter:description', content: data.description });
    }
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ name: 'robots', content: data.noindex ? 'noindex, follow' : 'index, follow' });

    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = canonical;
  }
}
