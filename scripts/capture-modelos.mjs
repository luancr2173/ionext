import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Jimp } from 'jimp';

const execFileAsync = promisify(execFile);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), 'public', reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 4399;
server.listen(PORT, async () => {
  console.log(`Static server running on http://localhost:${PORT}`);

  const slugs = ['assistencia-express', 'loja-smartphones', 'reparo-placas'];

  for (const slug of slugs) {
    const desktopPng = path.join(process.cwd(), `temp-${slug}-desktop.png`);
    const mobilePng = path.join(process.cwd(), `temp-${slug}-mobile.png`);
    const desktopJpg = path.join(process.cwd(), 'public', 'assets', 'portfolio', `${slug}.jpg`);
    const mobileJpg = path.join(process.cwd(), 'public', 'assets', 'portfolio', `${slug}-mobile.jpg`);

    const url = `http://localhost:${PORT}/modelos/${slug}/index.html`;

    console.log(`Capturing ${slug} desktop...`);
    await execFileAsync(chromePath, [
      '--headless=new',
      '--force-prefers-reduced-motion',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--window-size=1440,900',
      '--virtual-time-budget=6000',
      `--screenshot=${desktopPng}`,
      url,
    ]);

    console.log(`Capturing ${slug} mobile...`);
    await execFileAsync(chromePath, [
      '--headless=new',
      '--force-prefers-reduced-motion',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--window-size=500,1082',
      '--force-device-scale-factor=1.56',
      '--virtual-time-budget=6000',
      `--screenshot=${mobilePng}`,
      url,
    ]);

    // Converter para JPG de alta qualidade usando Jimp
    if (fs.existsSync(desktopPng)) {
      const imgD = await Jimp.read(desktopPng);
      imgD.resize({ w: 1440, h: 900 });
      await imgD.write(desktopJpg);
      fs.unlinkSync(desktopPng);
      console.log(`Generated ${desktopJpg}`);
    }

    if (fs.existsSync(mobilePng)) {
      const imgM = await Jimp.read(mobilePng);
      imgM.resize({ w: 390, h: 844 });
      await imgM.write(mobileJpg);
      fs.unlinkSync(mobilePng);
      console.log(`Generated ${mobileJpg}`);
    }
  }

  server.close();
  console.log('All portfolio shots captured and saved successfully!');
});
