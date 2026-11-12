// Comportamento comum dos sites-modelo da IONEXT:
// selo de demonstração, rolagem suave (Lenis) + GSAP, títulos palavra a palavra,
// seletor de animações, letreiro, botões de WhatsApp que explicam que é um modelo,
// e montagem da cena 3D com fallback.
import { webglAvailable } from './scene-base.js';

const IONEXT_WA = '5561998145516';
const STORE_KEY = 'ionext-modelo-animacoes';

export function ionextWhatsapp(message) {
  return `https://wa.me/${IONEXT_WA}?text=${encodeURIComponent(message)}`;
}

/**
 * @param {{ name: string, segment: string, scene?: () => Promise<any>, canvas?: HTMLCanvasElement }} opts
 */
export function initModelo(opts) {
  const html = document.documentElement;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const LenisCtor = window.Lenis;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  mountChrome(opts);
  splitTitles();

  let pref = readPref();
  let lenis = null;
  let ctx = null;
  let scene = null;

  const enabled = () => (pref === 'auto' ? !matchMedia('(prefers-reduced-motion: reduce)').matches : pref === 'on');

  function startMotion() {
    stopMotion();
    html.classList.remove('motion-off');
    if (!gsap || !ScrollTrigger) return;
    if (LenisCtor) {
      lenis = new LenisCtor({
        lerp: 0.1,
        // modais rolam com a roda do mouse mesmo com o Lenis ativo
        prevent: (node) => node.closest?.('[role="dialog"]') != null,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(lenisRaf);
      gsap.ticker.lagSmoothing(0);
    }
    ctx = gsap.context(() => {
      document.querySelectorAll('[data-split]').forEach((el, i) => {
        gsap.from(el.querySelectorAll('.w > span'), {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.06,
          delay: i === 0 ? 0.15 : 0,
          scrollTrigger: i === 0 ? undefined : { trigger: el, start: 'top 85%' },
        });
      });
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 28, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      document.querySelectorAll('[data-progress]').forEach((el) => {
        gsap.fromTo(el, { scaleY: 0 }, {
          scaleY: 1, ease: 'none', transformOrigin: 'top',
          scrollTrigger: { trigger: el.parentElement, start: 'top 70%', end: 'bottom 60%', scrub: true },
        });
      });
    });
    scene?.setAnimate(true);
  }

  function lenisRaf(time) {
    lenis?.raf(time * 1000);
  }

  function stopMotion() {
    ctx?.revert();
    ctx = null;
    if (lenis) {
      gsap?.ticker.remove(lenisRaf);
      lenis.destroy();
      lenis = null;
    }
  }

  function apply() {
    document.querySelectorAll('[data-motion]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.motion === pref)));
    if (enabled()) startMotion();
    else {
      stopMotion();
      html.classList.add('motion-off');
      scene?.setAnimate(false);
    }
  }

  document.querySelectorAll('[data-motion]').forEach((b) =>
    b.addEventListener('click', () => {
      pref = b.dataset.motion;
      try { localStorage.setItem(STORE_KEY, pref); } catch { /* sem storage */ }
      apply();
    }),
  );

  // letreiro: velocidade acompanha a rolagem
  const marquees = [...document.querySelectorAll('[data-marquee] .marquee-track')];
  let mx = 0;
  let lastY = scrollY;
  (function marqueeLoop() {
    if (marquees.length && !html.classList.contains('motion-off')) {
      const v = Math.min(Math.abs(scrollY - lastY), 60);
      mx -= 0.4 + v * 0.12;
      marquees.forEach((t) => {
        const w = t.scrollWidth / 2;
        if (w) t.style.transform = `translate3d(${mx % w}px,0,0)`;
      });
    }
    lastY = scrollY;
    requestAnimationFrame(marqueeLoop);
  })();

  // header ganha fundo depois de rolar
  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // menu mobile
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
    html.classList.toggle('menu-open', open);
    open ? lenis?.stop() : lenis?.start();
  });
  nav?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      menuBtn?.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      html.classList.remove('menu-open');
      lenis?.start();
    }),
  );

  // âncoras param abaixo do header fixo
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id && id.length > 1 ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      const offset = (header?.offsetHeight || 0) + 40;
      if (lenis) lenis.scrollTo(target, { offset: -offset });
      else scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset });
    }),
  );

  // cena 3D
  if (opts.canvas && opts.scene) {
    const stage = opts.canvas.closest('.hero-stage');
    if (!webglAvailable()) stage?.classList.add('no-webgl');
    else
      opts.scene()
        .then((create) => {
          scene = create(opts.canvas, { animate: enabled() });
          opts.canvas.classList.add('is-ready');
        })
        .catch((err) => {
          console.warn('[modelo] cena 3D indisponível', err);
          stage?.classList.add('no-webgl');
        });
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  apply();
}

function readPref() {
  try {
    const v = localStorage.getItem(STORE_KEY);
    if (v === 'on' || v === 'off' || v === 'auto') return v;
  } catch { /* sem storage */ }
  return 'auto';
}

/** Palavras em máscara, com espaço real entre elas (o textContent continua legível). */
function splitTitles() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.append(document.createTextNode(' '));
            else {
              const w = document.createElement('span');
              w.className = 'w';
              const inner = document.createElement('span');
              inner.textContent = p;
              w.append(inner);
              frag.append(w);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
  });
}

/** Selo de demonstração, botão flutuante e o aviso dos botões de WhatsApp. */
function mountChrome({ name, segment }) {
  const msg = `Olá! Vi o modelo de site de ${name} no portfólio da IONEXT e quero um site assim para a minha ${segment}.`;
  const link = ionextWhatsapp(msg);

  const bar = document.createElement('div');
  bar.className = 'demo-bar';
  bar.innerHTML = `<span><strong>Modelo de demonstração</strong> · sem marca real, dados de exemplo · site criado pela IONEXT</span>`;
  const barLink = document.createElement('a');
  barLink.href = link;
  barLink.target = '_blank';
  barLink.rel = 'noopener';
  barLink.textContent = 'Quero um site assim →';
  bar.append(barLink);
  document.body.prepend(bar);

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'wa-float';
  fab.setAttribute('aria-label', 'Falar pelo WhatsApp');
  fab.dataset.wa = '';
  fab.innerHTML = WA_ICON;
  document.body.append(fab);

  const dialog = document.createElement('div');
  dialog.className = 'demo-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'demo-dialog-title');
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="demo-dialog-panel">
      <p class="demo-dialog-label">Modelo de demonstração</p>
      <h2 id="demo-dialog-title">No site real, este botão abre o WhatsApp da clínica.</h2>
      <p>O paciente já chega com a mensagem pronta, dizendo o tratamento que quer. Este é um modelo com dados de exemplo, feito pela IONEXT para mostrar como o site da sua clínica pode ficar.</p>
      <div class="demo-dialog-actions">
        <a class="demo-dialog-cta" target="_blank" rel="noopener">Quero um site assim</a>
        <button type="button" class="demo-dialog-close">Continuar vendo o modelo</button>
      </div>
    </div>`;
  dialog.querySelector('.demo-dialog-cta').href = link;
  document.body.append(dialog);

  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.documentElement.classList.add('dialog-open');
    dialog.querySelector('.demo-dialog-cta').focus();
  };
  const close = () => {
    dialog.hidden = true;
    document.documentElement.classList.remove('dialog-open');
    lastFocus?.focus?.();
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('[data-wa]');
    if (t) {
      e.preventDefault();
      open();
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('.demo-dialog-close')) close();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dialog.hidden) close();
  });
}

const WA_ICON =
  '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 6.9L3 29l6.5-2c1.9 1 4.1 1.6 6.5 1.6 7.2 0 13-5.7 13-12.8S23.2 3 16 3Zm0 23.4c-2.1 0-4.1-.6-5.8-1.6l-.4-.2-3.9 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.9C5.1 10 10 5.2 16 5.2S26.9 10 26.9 15.8 22 26.4 16 26.4Zm6-7.8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z"/></svg>';
