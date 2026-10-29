# Kalima lugʻati

Arabcha–oʻzbekcha lugʻat va tinglab yodlash mashqi. Al-Manhaj al-ʻĀlamiy A1 darsligi: 1119 ta soʻz va ibora, 18 ta mavzu. React + Vite.

- **Lugʻat:** mavzular boʻyicha yoki alifbo boʻyicha (oʻzbek A–Z, arab ا–ي), qidiruv, soʻzni bosganda arabchasi oʻqiladi.
- **Tinglab yodlash:** savol soʻz aytiladi, belgilangan vaqtdan keyin (0–120 soniya) tarjimasi aytiladi. Mavzu, tartib (mavzu / alifbo / aralash), yoʻnalish (UZ→AR yoki AR→UZ) tanlanadi.
- **Ovoz:** oʻzbekcha — Xurshid (VoiceLab), arabcha — Hamed (Microsoft). Ovoz fayli boʻlmasa qurilmaning oʻz ovozi ishlatiladi.
- **Kun/tun rejimi:** boshida qurilmaga qarab, tugma bilan almashtiriladi va eslab qolinadi.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/index.html va dist/audio/ — istalgan statik hostingga qoʻyiladi
```

`npm run build` qoʻshimcha ravishda `dist/artifact.html` ni ham yaratadi (Claude Artifact uchun, `<html>/<head>/<body>` teglarisiz).

## Tuzilishi

- `src/data/topics.json` — lugʻat: mavzu → boʻlimlar → `[oʻzbekcha, arabcha, oʻqilishi, izoh]`. Izohdagi `{…}` arabcha yozuvda chiqadi.
- `src/lib/` — matn yordamchilari (`text.js`), soʻzlar (`words.js`), sozlamalar (`settings.js`), kun/tun rejimi (`theme.js`), ovoz (`speech.js`), mashq jarayoni (`usePractice.js`).
- `src/components/` — `Dictionary.jsx` (lugʻat), `Practice.jsx` (mashq sozlamalari va pleyer), `icons.jsx`.
- `public/audio/<til>/<mavzu>.json` — yozib olingan ovozlar, har mavzu uchun bitta fayl (`kalit → base64 mp3`).
- `tools/generate-audio.js` — ovozlarni yaratadi va toʻplamlarga yigʻadi.
- `compare/ovozlar.html` — ovozlarni solishtirish sahifasi.

## Ovozlarni qayta yaratish

```bash
pip install edge-tts
npm run audio -- ar                         # arabcha, Hamed (bepul)
npm run audio -- uz                         # oʻzbekcha, Sardor (bepul)
VOICELAB_API_KEY=vlk_... npm run audio -- uz --voicelab voice_2QZX3LFMkNO0lNyrOZ-WwJxK --jobs 4   # Xurshid (pullik, 1 belgi = 1 kredit)
```

Qoʻshimcha: `--only salom,oila` — faqat shu mavzular, `--jobs N` — parallel soʻrovlar, `--test` — bitta soʻz bilan sinov. Tayyor fayllar qayta yaratilmaydi; kredit tugasa skript toʻxtaydi va tayyorlarini toʻplamga yigʻadi. API kalitni hech qachon kodga yoki repozitoriyga yozmang.
