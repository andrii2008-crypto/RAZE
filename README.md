# 🔪 RAZE — Download Everything

**Telegram developer:** https://t.me/RAZECRYSTAL

## Структура проекта

```
raze/
├── server.js        ← Node.js бэкенд (Express + yt-dlp)
├── package.json     ← зависимости
├── render.yaml      ← конфиг для Render.com
└── public/
    └── index.html   ← фронтенд (положи сюда index.html)
```

## Деплой на Render.com

### 1. Подготовка репозитория

1. Создай новый репозиторий на GitHub
2. Положи все файлы:
   - `server.js`
   - `package.json`
   - `render.yaml`
   - `public/index.html` (папку `public` создай сам)
3. Сделай `git push`

### 2. Деплой на Render

1. Зайди на [render.com](https://render.com) → **New → Web Service**
2. Подключи свой GitHub репозиторий
3. Настройки:
   - **Environment:** Node
   - **Build Command:**
     ```
     npm install && apt-get install -y python3-pip ffmpeg && pip3 install yt-dlp
     ```
   - **Start Command:** `node server.js`
4. Нажми **Deploy**

> ⚠️ Важно: Render Free tier имеет ограничение по RAM. Для больших файлов рекомендуется план **Starter ($7/мес)**.

## Локальный запуск

```bash
# Установи зависимости
npm install

# Установи yt-dlp (нужен Python)
pip install yt-dlp

# Установи ffmpeg (нужен для конвертации)
# Windows: https://ffmpeg.org/download.html
# Linux: sudo apt install ffmpeg
# Mac: brew install ffmpeg

# Запусти
npm start
# → http://localhost:3000
```

## API

**POST /api/download**
```json
{
  "url": "https://youtube.com/watch?v=...",
  "format": "video",   // "video" | "audio"
  "quality": "1080"    // "best" | "2160" | "1080" | "720" | "480" | "360"
                       // для audio: "mp3_320" | "mp3_256" | "flac" | "aac"
}
```
Returns: file blob (mp4/mp3/flac etc.)

**POST /api/info**
```json
{ "url": "https://..." }
```
Returns: `{ title, thumbnail, duration, uploader, platform }`

---
*Built by @RAZECRYSTAL*
