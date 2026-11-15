import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { SeoService } from './seo.service';

@Component({ standalone: true, template: '' })
class Blank {}

describe('SeoService', () => {
  let router: Router;

  beforeEach(() => {
    document.head.querySelectorAll('link[rel="canonical"], meta[name="description"], meta[name="robots"]').forEach((el) => el.remove());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank, title: 'Home — IONEXT', data: { description: 'Descrição da home' } },
          { path: 'servicos', component: Blank, title: 'Serviços — IONEXT', data: { description: 'Descrição de serviços' } },
          { path: '**', component: Blank, title: '404 — IONEXT', data: { description: 'Não encontrada', noindex: true } },
        ]),
      ],
    });
    TestBed.inject(SeoService).init();
    router = TestBed.inject(Router);
  });

  const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href;
  const meta = (sel: string) => document.head.querySelector<HTMLMetaElement>(sel)?.content;

  it('cada página declara o próprio canonical, sem query de filtro', async () => {
    await router.navigateByUrl('/servicos?ramo=x#topo');
    expect(canonical()).toBe('https://ionext.com.br/servicos');
    expect(meta('meta[property="og:url"]')).toBe('https://ionext.com.br/servicos');
    await router.navigateByUrl('/');
    expect(canonical()).toBe('https://ionext.com.br/');
  });

  it('troca descrição e títulos de compartilhamento pela página atual', async () => {
    await router.navigateByUrl('/servicos');
    expect(meta('meta[name="description"]')).toBe('Descrição de serviços');
    expect(meta('meta[property="og:description"]')).toBe('Descrição de serviços');
    expect(meta('meta[property="og:title"]')).toBe('Serviços — IONEXT');
    expect(meta('meta[name="robots"]')).toBe('index, follow');
  });

  it('a 404 não é indexada', async () => {
    await router.navigateByUrl('/nao-existe');
    expect(meta('meta[name="robots"]')).toBe('noindex, follow');
  });
});
