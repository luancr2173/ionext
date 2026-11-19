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
      'Content-Type': ext === '.mp4' ? 'video/mp4' : 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4899, async () => {
  for (const t of [0.0, 0.5, 2.0]) {
    const htmlContent = `<!DOCTYPE html>
<html>
<body style="margin:0;background:#000">
<video id="v" src="/modelos/loja-smartphones/iphone17-scroll.mp4" muted playsinline autoplay style="width:100vw;height:100vh;object-fit:contain"></video>
<script>
const v = document.getElementById('v');
v.onloadedmetadata = () => {
  v.currentTime = ${t};
  v.pause();
};
</script>
</body>
</html>`;
    fs.writeFileSync(path.join(process.cwd(), 'public', 'temp-frame.html'), htmlContent);
    await execFileAsync(chromePath, [
      '--headless=new',
      '--virtual-time-budget=2000',
      `--screenshot=frame-${t}.png`,
      'http://localhost:4899/temp-frame.html',
    ]);
    console.log(`Saved frame-${t}.png`);
  }
  server.close();
});
