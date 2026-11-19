import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const server = http.createServer((req, res) => {
  const filePath = path.join(process.cwd(), 'public', req.url.split('?')[0]);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': ext === '.mp4' ? 'video/mp4' : (ext === '.css' ? 'text/css' : (ext === '.js' ? 'text/javascript' : 'text/html')),
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4888, async () => {
  // Cria uma página que rola diretamente para o meio da seção do vídeo
  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'test-scroll-pos.html'),
    `<!DOCTYPE html>
<html>
<head>
<script>
window.location.href = 'http://localhost:4888/modelos/loja-smartphones/index.html#experiencia';
</script>
</head>
<body></body>
</html>`
  );

  const shotPath = path.join(process.cwd(), 'mobile-video-section-test.png');
  try {
    await execFileAsync(chromePath, [
      '--headless=new',
      '--window-size=390,844',
      '--force-device-scale-factor=2',
      '--virtual-time-budget=3000',
      `--screenshot=${shotPath}`,
      'http://localhost:4888/modelos/loja-smartphones/index.html#experiencia',
    ]);
    console.log('Mobile video section screenshot saved to mobile-video-section-test.png');
  } catch (e) {
    console.error('Error:', e);
  }
  server.close();
});
