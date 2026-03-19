const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'RAZE' }));

// ── API: Get info about media
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const cmd = `yt-dlp --dump-json --no-playlist "${url}"`;
  exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) return res.status(400).json({ error: 'Cannot fetch media info. Check the URL.' });
    try {
      const info = JSON.parse(stdout);
      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        uploader: info.uploader,
        platform: info.extractor_key,
      });
    } catch {
      res.status(500).json({ error: 'Failed to parse media info' });
    }
  });
});

// ── API: Download
app.post('/api/download', async (req, res) => {
  const { url, format = 'video', quality = 'best' } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `raze_${Date.now()}`);

  let ytdlpArgs = [];
  let ext = 'mp4';

  if (format === 'audio') {
    ext = quality === 'flac' ? 'flac' : quality === 'aac' ? 'aac' : 'mp3';
    const audioBitrate = quality.startsWith('mp3_') ? quality.replace('mp3_','') : '320';
    ytdlpArgs = [
      '-x',
      '--audio-format', ext === 'flac' ? 'flac' : ext === 'aac' ? 'aac' : 'mp3',
      '--audio-quality', ext === 'mp3' ? audioBitrate + 'k' : '0',
      '--no-playlist',
      '-o', tmpFile + '.%(ext)s',
      url,
    ];
  } else {
    // video
    ext = 'mp4';
    let formatStr = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    if (quality !== 'best') {
      formatStr = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}][ext=mp4]/best[height<=${quality}]`;
    }
    ytdlpArgs = [
      '-f', formatStr,
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '-o', tmpFile + '.%(ext)s',
      url,
    ];
  }

  const ytdlp = spawn('yt-dlp', ytdlpArgs, { timeout: 120000 });
  let stderr = '';
  ytdlp.stderr.on('data', d => { stderr += d.toString(); });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.error('yt-dlp error:', stderr);
      return res.status(400).json({ error: 'Download failed. Unsupported or private content.' });
    }

    // Find the output file
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(path.basename(tmpFile)));
    if (!files.length) return res.status(500).json({ error: 'Output file not found' });

    const outFile = path.join(tmpDir, files[0]);
    const actualExt = path.extname(outFile).replace('.','') || ext;
    const mimeMap = {
      mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska',
      mp3: 'audio/mpeg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4', opus: 'audio/opus',
    };
    const mime = mimeMap[actualExt] || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="raze.${actualExt}"`);
    res.setHeader('Content-Type', mime);

    const stream = fs.createReadStream(outFile);
    stream.pipe(res);
    stream.on('end', () => {
      fs.unlink(outFile, () => {});
    });
    stream.on('error', () => {
      res.status(500).json({ error: 'Stream error' });
    });
  });

  ytdlp.on('error', (err) => {
    console.error('spawn error:', err);
    res.status(500).json({ error: 'yt-dlp not found on server' });
  });
});

app.listen(PORT, () => {
  console.log(`🔪 RAZE running on port ${PORT}`);
});
