// Lugʻatdagi har bir soʻz uchun ovoz yaratadi va mavzu boʻyicha toʻplamlarga yigʻadi.
//
//   npm run audio                         — oʻzbekcha Sardor + arabcha Hamed (Microsoft, edge-tts)
//   npm run audio -- uz                   — faqat oʻzbekcha Sardor
//   npm run audio -- ar                   — faqat arabcha Hamed
//   npm run audio -- uz --aisha Gulnoza   — oʻzbekcha Aisha/VoiceLab ovozi (AISHA_API_KEY kerak);
//                                           shaxsiy ovoz uchun nom oʻrniga voice_id raqami: --aisha 123
//   npm run audio -- uz --aisha Gulnoza --test   — bitta soʻz yuborib, API javobini koʻrsatadi
//   npm run audio -- uz --voicelab voice_...     — VoiceLab yangi API ovozi (vlk_ kalit; masalan Xurshid)
//   npm run audio -- ar --only uyjoy,obhavo      — faqat koʻrsatilgan mavzular
//   npm run audio -- ar --jobs 6                 — bir vaqtda 6 ta soʻz (Microsoft ovozlari uchun tezroq)
//
// Alohida mp3 fayllar public/audio/<til>-<ovoz>/ ga tushadi (keyingi ishga tushirishda qayta yaratilmaydi).
// Saytga esa faqat toʻplamlar joylanadi: public/audio/<til>/<mavzu>.json ("kalit → base64 mp3"),
// chunki sayt versiyasida 511 tadan ortiq fayl va bitta faylda 16 MB dan ortiq boʻlolmaydi.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFile, execFileSync} from "node:child_process";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {arSlug, pretty, uzSlug} from "../src/lib/text.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
// --only uyjoy,obhavo — faqat shu mavzular (id lari topics.json da)
const only = typeof flag("--only") === "string" ? flag("--only").split(",") : null;
const TOPICS = JSON.parse(fs.readFileSync(path.join(root, "src/data/topics.json"), "utf8")).filter(t => !only || only.includes(t.id));
const aishaVoice = flag("--aisha"), testOnly = !!flag("--test");
const langs = args.filter(a => a === "uz" || a === "ar");

const spokenUz = s => pretty(s).replace(/\s*\((.*?)\)/g, ", $1");
const proxy = process.env.HTTPS_PROXY ? ["--proxy", process.env.HTTPS_PROXY] : [];

// --- Microsoft (edge-tts) ---
const run = promisify(execFile);
function edgeTts(voice){
  // Yarim yozilgan fayl qolmasligi uchun avval vaqtinchalik faylga yoziladi
  return async (text, file) => {
    const tmp = file + ".part";
    await run("edge-tts", [...proxy, "--voice", voice, "--text", text, "--write-media", tmp]);
    fs.renameSync(tmp, file);
  };
}

// --- Aisha / VoiceLab ---
// API (https://aisha.group/llms-api.txt): POST https://back.aisha.group/api/v1/tts/post/, sarlavha X-Api-Key,
// maydonlar transcript, language=uz va ovoz: tayyor ovoz uchun model (hozircha faqat Gulnoza),
// hisobingizdagi shaxsiy ovoz uchun voice_id (raqam). Javob: {"audio_path": "/media/tts_audios/<id>.wav"}.
// --aisha Gulnoza yoki --aisha 123 (voice_id). WAV ffmpeg bilan mp3 ga oʻtkaziladi.
const AISHA_BASE = process.env.AISHA_URL || "https://back.aisha.group";
function aishaTts(voice){
  const key = process.env.AISHA_API_KEY;
  if (!key) { console.error("AISHA_API_KEY topilmadi: environment sozlamalariga qoʻshing."); process.exit(1); }
  const voiceFields = /^\d+$/.test(voice) ? ["-F", "voice_id=" + voice]
    : ["-F", "model=" + voice[0].toUpperCase() + voice.slice(1).toLowerCase(), "-F", "mood=Neutral"];
  return (text, file) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aisha-"));
    const body = path.join(tmp, "body");
    const status = execFileSync("curl", ["-sS", "-o", body, "-w", "%{http_code}", "-X", "POST", AISHA_BASE + "/api/v1/tts/post/",
      "-H", "X-Api-Key: " + key, "-F", "transcript=" + text, "-F", "language=uz", ...voiceFields]).toString();
    const reply = fs.readFileSync(body, "utf8");
    if (testOnly) console.log(`API javobi (${status}):`, reply.slice(0, 500));
    if (status === "402") throw Object.assign(new Error("Aisha: kredit tugadi"), {balance: true});
    if (!/^20[01]$/.test(status)) throw new Error(`Aisha ${status}: ${reply.slice(0, 300)}`);
    const {audio_path: audioPath} = JSON.parse(reply);
    if (!audioPath) throw new Error("Javobda audio_path yoʻq: " + reply.slice(0, 300));
    const audio = path.join(tmp, "audio");
    execFileSync("curl", ["-sS", "--fail", "-H", "X-Api-Key: " + key, "-o", audio, /^https?:/.test(audioPath) ? audioPath : AISHA_BASE + audioPath]);
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", audio, "-ac", "1", "-ar", "24000", "-b:a", "48k", file]);
    fs.rmSync(tmp, {recursive: true, force: true});
  };
}

// --- VoiceLab (yangi API, vlk_ kalit) ---
// https://docs.voicelab.uz/markdown/api/tts.md: POST https://api.voicelab.uz/v1/tts, Authorization: Bearer vlk_...,
// JSON {text, language: "uz", voice_id: "voice_..."}; 200 → WAV, 202 → navbatdagi ish (status_url orqali kutiladi).
// 1 belgi = 1 kredit; kredit tugasa 402 qaytadi. Kalit VOICELAB_API_KEY yoki AISHA_API_KEY da.
const VOICELAB_BASE = "https://api.voicelab.uz";
function voicelabTts(voiceId){
  const key = process.env.VOICELAB_API_KEY || process.env.AISHA_API_KEY;
  if (!key || !key.startsWith("vlk_")) { console.error("VoiceLab kaliti (vlk_...) topilmadi."); process.exit(1); }
  // curl ishlatiladi: u HTTPS_PROXY ni oʻzi hisobga oladi (Node fetch esa yoʻq)
  const curl = async (args, out) => {
    const {stdout} = await run("curl", ["-sS", "-m", "120", "-o", out, "-w", "%{http_code}", ...args]);
    return Number(stdout);
  };
  return async (text, file) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vl-")), body = path.join(tmp, "body"), head = path.join(tmp, "head");
    try {
      const status = await curl(["-D", head, "-X", "POST", VOICELAB_BASE + "/v1/tts",
        "-H", "Authorization: Bearer " + key, "-H", "Content-Type: application/json",
        "-H", "Idempotency-Key: kalima-" + voiceId.slice(-12) + "-" + uzSlug(text),
        "--data-binary", JSON.stringify({text, language: "uz", voice_id: voiceId, speed: 1})], body);
      let wav = body;
      if (status === 202) {
        const job = JSON.parse(fs.readFileSync(body, "utf8"));
        let done = false;
        for (let i = 0; i < 60 && !done; i++) {
          await new Promise(r => setTimeout(r, 1000 + i * 250));
          await curl(["-H", "Authorization: Bearer " + key, VOICELAB_BASE + job.status_url], body);
          const st = JSON.parse(fs.readFileSync(body, "utf8"));
          if (st.status === "failed") throw new Error("VoiceLab: " + JSON.stringify(st.error));
          if (st.status === "completed") { wav = path.join(tmp, "audio"); await curl([st.audio_url], wav); done = true; }
        }
        if (!done) throw new Error("VoiceLab: ish juda uzoq davom etdi");
      } else if (status !== 200) {
        const reply = fs.readFileSync(body, "utf8");
        if (status === 402 || /insufficient_(credits|balance)/.test(reply)) throw Object.assign(new Error("VoiceLab: kredit tugadi"), {balance: true});
        throw new Error(`VoiceLab ${status}: ${reply.slice(0, 300)}`);
      }
      if (testOnly) console.log(`VoiceLab: ${fs.statSync(wav).size} bayt, ${(fs.readFileSync(head, "utf8").match(/x-voicelab-characters-used:\s*(\d+)/i) || [])[1]} belgi`);
      await run("ffmpeg", ["-loglevel", "error", "-y", "-i", wav, "-ac", "1", "-ar", "24000", "-b:a", "48k", file + ".part.mp3"]);
      fs.renameSync(file + ".part.mp3", file);
    } finally { fs.rmSync(tmp, {recursive: true, force: true}); }
  };
}
const voicelabVoice = flag("--voicelab");

const JOBS = {
  uz: voicelabVoice
    ? {name: "uz-voicelab-" + voicelabVoice, col: 0, slug: uzSlug, spoken: spokenUz, make: voicelabTts(voicelabVoice)}
    : aishaVoice
    ? {name: "uz-" + aishaVoice, col: 0, slug: uzSlug, spoken: spokenUz, make: aishaTts(aishaVoice)}
    : {name: "uz-sardor", col: 0, slug: uzSlug, spoken: spokenUz, make: edgeTts("uz-UZ-SardorNeural")},
  ar: {name: "ar-hamed", col: 1, slug: arSlug, spoken: s => s.replace(/ـ/g, ""), make: edgeTts("ar-SA-HamedNeural")},
};

for (const lang of langs.length ? langs : ["uz", "ar"]) {
  const job = JOBS[lang], outDir = path.join(root, "public", "audio", job.name);
  fs.mkdirSync(outDir, {recursive: true});
  const texts = new Set();
  TOPICS.forEach(t => t.s.forEach(([, ws]) => ws.forEach(w => texts.add(w[job.col]))));
  if (testOnly) {
    const text = [...texts][0], file = path.join(outDir, job.slug(text) + ".mp3");
    await job.make(job.spoken(text), file);
    console.log(`Sinov: "${text}" → ${file} (${fs.statSync(file).size} bayt)`);
    continue;
  }
  const todo = [...texts].filter(text => { const f = path.join(outDir, job.slug(text) + ".mp3"); return !(fs.existsSync(f) && fs.statSync(f).size > 0); });
  const jobs = aishaVoice && lang === "uz" ? 1 : Math.max(1, Number(flag("--jobs")) || 1);
  let made = 0, failed = [], outOfCredit = false;
  const worker = async () => {
    while (todo.length && !outOfCredit) {
      const text = todo.shift(), file = path.join(outDir, job.slug(text) + ".mp3");
      for (let attempt = 1; ; attempt++) {
        try { await job.make(job.spoken(text), file); made++; break; }
        catch (e) {
          // Kredit tugasa toʻxtaymiz: tayyor boʻlganlari toʻplamga kiradi, qolganlari eski ovozda qoladi
          if (e.balance) { outOfCredit = true; console.log(`${job.name}: kredit tugadi, ${todo.length + 1} ta soʻz qoldi`); break; }
          if (attempt >= 3) { failed.push(text); break; }
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }
      }
      if (made % 50 === 0) console.log(`${job.name}: ${made} ta tayyor`);
    }
  };
  await Promise.all(Array.from({length: jobs}, worker));
  if (failed.length) { console.error(`${failed.length} ta soʻz yaratilmadi:`, failed); process.exit(1); }
  if (outOfCredit) console.log(`${job.name}: ${made} ta yangi fayl yaratildi`);
  console.log(`${job.name}: ${texts.size} ta matn, ${made} ta yangi fayl → ${outDir}`);
  const packDir = path.join(root, "public", "audio", lang);
  fs.mkdirSync(packDir, {recursive: true});
  // Toʻplamga faqat tayyor fayllar kiradi; toʻplamda yoʻq soʻz saytda eski ovozda yoki telefon ovozida oʻqiladi
  for (const topic of TOPICS) {
    const map = {};
    topic.s.forEach(([, ws]) => ws.forEach(w => {
      const k = job.slug(w[job.col]), f = path.join(outDir, k + ".mp3");
      if (fs.existsSync(f)) map[k] = fs.readFileSync(f).toString("base64");
    }));
    if (Object.keys(map).length) fs.writeFileSync(path.join(packDir, topic.id + ".json"), JSON.stringify(map));
  }
  console.log(`${lang}: ${TOPICS.length} ta toʻplam → ${packDir}`);
}
