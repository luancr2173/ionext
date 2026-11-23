// Efeitos leves dos sites-modelo, em JS puro (portes de componentes do React Bits):
// count-up (números que sobem ao entrar na tela), spotlight-card (luz que segue o
// mouse no cartão) e rotating-text (palavra do título que alterna).
// Tudo respeita o seletor de animações do kit (html.motion-off) e prefers-reduced-motion.

const motionOff = () =>
  document.documentElement.classList.contains('motion-off') ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** <strong data-count="1200" data-suffix="+" data-decimals="0">1.200+</strong> */
export function countUp(root = document) {
  const fmt = (n, d) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const els = [...root.querySelectorAll('[data-count]')];
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const to = parseFloat(el.dataset.count);
        const d = parseInt(el.dataset.decimals || '0', 10);
        const pre = el.dataset.prefix || '';
        const suf = el.dataset.suffix || '';
        const final = `${pre}${fmt(to, d)}${suf}`;
        if (motionOff()) return void (el.textContent = final);
        const dur = 1600;
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = `${pre}${fmt(to * eased, d)}${suf}`;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = final;
        };
        requestAnimationFrame(step);
      }),
    { threshold: 0.4 },
  );
  els.forEach((el) => io.observe(el));
}

/** Cartões [data-spotlight] ganham --mx/--my para um radial-gradient no CSS. Só com mouse. */
export function spotlight(root = document) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  root.querySelectorAll('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/**
 * <span data-rotate="força|constância|resultado">força</span>
 * Troca a palavra a cada 2,4 s com a palavra subindo por máscara.
 */
export function rotateWords(root = document) {
  root.querySelectorAll('[data-rotate]').forEach((el) => {
    const words = el.dataset.rotate.split('|');
    let i = 0;
    el.classList.add('rot');
    el.innerHTML = '';
    const inner = document.createElement('span');
    inner.className = 'rot-in';
    inner.textContent = words[0];
    el.append(inner);
    // largura fixa pela palavra mais longa: o título não pula
    el.setAttribute('aria-label', words.join(', '));
    setInterval(() => {
      if (motionOff() || document.hidden) return;
      i = (i + 1) % words.length;
      inner.classList.add('is-out');
      setTimeout(() => {
        inner.textContent = words[i];
        inner.classList.remove('is-out');
        inner.classList.add('is-in');
        requestAnimationFrame(() => requestAnimationFrame(() => inner.classList.remove('is-in')));
      }, 380);
    }, 2400);
  });
}

export function initFx() {
  countUp();
  spotlight();
  rotateWords();
}
