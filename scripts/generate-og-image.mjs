/**
 * Gera public/og-image.png (1200x630) para compartilhamento em redes sociais.
 * Uso: node scripts/generate-og-image.mjs
 *
 * É uma versão provisória feita com o logo oficial + tipografia bitmap do jimp.
 * Para a versão final, substitua por uma arte exportada do Figma no mesmo caminho.
 */
import { Jimp, loadFont, rgbaToInt } from 'jimp';
import { SANS_64_WHITE, SANS_32_WHITE } from 'jimp/fonts';

const W = 1200;
const H = 630;

const img = new Jimp({ width: W, height: H, color: 0x0a0a0cff });

// brilho azul íon no canto inferior direito (a "garganta" do funil)
const cx = 930;
const cy = 470;
img.scan(0, 0, W, H, (x, y, idx) => {
  const d = Math.hypot(x - cx, (y - cy) * 1.2) / 520;
  const a = Math.max(0, 1 - d) ** 2.2;
  img.bitmap.data[idx] = Math.min(255, 10 + 77 * a);
  img.bitmap.data[idx + 1] = Math.min(255, 10 + 124 * a);
  img.bitmap.data[idx + 2] = Math.min(255, 12 + 255 * a);
});

// anéis do funil (elipses finas)
for (let i = 0; i < 9; i++) {
  const ft = i / 8;
  const rx = 18 + 300 * (1 - ft) ** 2.2;
  const ry = rx * 0.2;
  const yy = 90 + ft ** 0.8 * 330;
  const alpha = 0.1 + ft * 0.25;
  for (let t = 0; t < Math.PI * 2; t += 1 / Math.max(rx, 40)) {
    const px = Math.round(cx + Math.cos(t) * rx);
    const py = Math.round(yy + Math.sin(t) * ry);
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    const base = img.getPixelColor(px, py);
    const r = (base >>> 24) & 255;
    const g = (base >>> 16) & 255;
    const b = (base >>> 8) & 255;
    img.setPixelColor(
      rgbaToInt(
        Math.round(r + (243 - r) * alpha),
        Math.round(g + (242 - g) * alpha),
        Math.round(b + (239 - b) * alpha),
        255,
      ),
      px,
      py,
    );
  }
}

const logo = await Jimp.read('public/assets/logo/ionext-logo-white.png');
logo.scaleToFit({ w: 300, h: 110 });
img.composite(logo, 80, 70);

const big = await loadFont(SANS_64_WHITE);
const small = await loadFont(SANS_32_WHITE);
img.print({ font: big, x: 80, y: 300, text: 'IA no seu funil', maxWidth: 700 });
img.print({ font: big, x: 80, y: 372, text: 'de vendas.', maxWidth: 700 });
img.print({ font: small, x: 80, y: 486, text: 'Agentes que respondem, qualificam e agendam 24/7.', maxWidth: 1100 });
img.print({ font: small, x: 80, y: 548, text: 'ionext.com.br', maxWidth: 600 });

await img.write('public/og-image.png');
console.log('public/og-image.png gerado (1200x630)');
