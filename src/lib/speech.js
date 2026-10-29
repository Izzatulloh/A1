// Ovoz: avval oldindan yozib olingan ovoz — oʻzbekcha va arabcha Hamed; boʻlmasa qurilmaning oʻz ovozi (Web Speech API).
// Yozib olingan ovozlar mavzu boʻyicha toʻplamlarda: audio/<til>/<mavzu>.json ("kalit → base64 mp3").
// Sayt versiyasida 511 tadan ortiq fayl va bitta faylda 16 MB dan ortiq boʻlolmagani uchun shunday boʻlingan.
// Toʻplamda topilmasa: eski umumiy audio/<til>.json, soʻng alohida audio/<til>/<kalit>.mp3 qidiriladi.
import {useEffect, useState} from "react";
import {arSlug, uzSlug} from "./text.js";

const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
export const hasSynth = !!synth;
let voices = synth ? synth.getVoices() : [];
const listeners = new Set();
if (synth) {
  const reload = () => { voices = synth.getVoices(); listeners.forEach(fn => fn(voices)); };
  synth.addEventListener ? synth.addEventListener("voiceschanged", reload) : (synth.onvoiceschanged = reload);
}
const packs = {};
const loadPack = path => packs[path] || (packs[path] = fetch(path)
  .then(r => (r.ok && /json/.test(r.headers.get("content-type") || "") ? r.json() : {}))
  .catch(() => { packs[path] = null; return {}; }));
const audioKey = (text, lang) => (lang === "uz" ? uzSlug(text) : arSlug(text));
// Mashq boshlanganda kerakli mavzular toʻplamlarini oldindan yuklab qoʻyish uchun
export function preloadTopics(topicIds){
  if (typeof fetch === "undefined") return;
  topicIds.reduce((p, t) => p.then(() => Promise.all(["uz", "ar"].map(l => loadPack(`audio/${l}/${t}.json`)))), Promise.resolve());
}
async function recordedSrc(text, lang, topic){
  const k = audioKey(text, lang);
  for (const path of [topic && `audio/${lang}/${topic}.json`, `audio/${lang}.json`]) {
    if (!path) continue;
    const m = await loadPack(path);
    if (m[k]) return "data:audio/mpeg;base64," + m[k];
  }
  return `audio/${lang}/${k}.mp3`;
}

// Ovozlar roʻyxati yoki fayllar holati oʻzgarsa komponent qayta chiziladi
export function useVoices(){
  const [list, setList] = useState(voices);
  useEffect(() => { listeners.add(setList); setList(voices.slice()); return () => listeners.delete(setList); }, []);
  return list;
}

export const vlang = v => (v.lang || "").toLowerCase().replace("_", "-");
const byLang = p => voices.filter(v => vlang(v).startsWith(p));
export function pickVoice(lang, S){
  const saved = lang === "uz" ? S.uzVoice : S.arVoice;
  if (saved) { const v = voices.find(v => v.voiceURI === saved); if (v) return v; }
  if (lang === "ar") { const a = byLang("ar"); return a.find(v => /sa/.test(vlang(v))) || a[0] || null; }
  return byLang("uz")[0] || byLang("tr")[0] || null;
}
// Oʻzbek ovozi boʻlmasa, turkcha ovoz lotin yozuvini toʻgʻri oʻqishi uchun harflarni moslaymiz
function ttsText(text, lang, v){
  if (lang !== "uz") return text;
  let t = text.replace(/[ʻʼ’‘`]/g, "'").replace(/\(.*?\)/g, "");
  if (v && vlang(v).startsWith("tr")) {
    t = t.toLowerCase().replace(/o'/g, "o").replace(/g'/g, "ğ").replace(/sh/g, "ş").replace(/ch/g, "ç")
         .replace(/x/g, "h").replace(/q/g, "k").replace(/j/g, "c");
  }
  return t.replace(/'/g, "");
}

const audioEl = typeof Audio !== "undefined" ? new Audio() : null;
if (audioEl) audioEl.preload = "auto";
// Har bir ijro oʻz raqamiga ega: eski ijroning kech kelgan hodisalari (pause, ended, taymer) yangisiga taʼsir qilmaydi
let playId = 0, endCurrent = null;
function playRecorded(src, rate){
  if (endCurrent) endCurrent();
  return new Promise(res => {
    if (!audioEl) return res(false);
    const id = ++playId, mine = () => id === playId;
    let done = false, started = false;
    const fin = ok => { if (done) return; done = true; clearTimeout(to); if (endCurrent === stop) endCurrent = null; res(ok); };
    const stop = () => fin(true);
    endCurrent = stop;
    const to = setTimeout(() => fin(started), 15000);
    audioEl.onended = () => { if (mine()) fin(true); };
    audioEl.onerror = () => { if (mine()) fin(false); };
    audioEl.onpause = () => { if (mine() && started) fin(true); };
    audioEl.src = src;
    audioEl.playbackRate = Math.min(1.5, Math.max(0.5, rate / 0.9));
    audioEl.play().then(() => { if (mine()) started = true; }, () => { if (mine()) fin(false); });
  });
}
function speakTts(text, lang, S){
  if (audioEl) audioEl.pause();
  return new Promise(res => {
    if (!synth) { setTimeout(res, 700 + text.length * 50); return; }
    const v = pickVoice(lang, S);
    const u = new SpeechSynthesisUtterance(ttsText(text, lang, v));
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang === "ar" ? "ar-SA" : "uz-UZ";
    u.rate = S.rate;
    let done = false;
    const fin = () => { if (done) return; done = true; clearTimeout(to); res(); };
    const to = setTimeout(fin, 2500 + text.length * 230 / S.rate);
    u.onend = fin; u.onerror = fin;
    speakTts.current = u; // Chrome ovoz tugashidan oldin utterance'ni oʻchirib yubormasligi uchun
    synth.cancel();
    synth.speak(u);
  });
}
// iPhone ovozni faqat bosish paytida boshlangan audio elementga ruxsat beradi: birinchi bosishda
// jimjit qisqa ovoz darhol oʻynatiladi, keyin shu element bilan istalgan payt ovoz chiqarish mumkin
const SILENT = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEwAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAqAAbW1tbW1tbW1tbW1tbW1tbW1tbZKSkpKSkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb29vb2///////////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQEUAAAAAAAAAKgvT9A1gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
let unlocked = false;
// alive: mashq tsikli hali dolzarbmi; toʻplam yuklanguncha foydalanuvchi Keyingi/Oldingi bossa, eski soʻz ijro etilmaydi
export async function speak(text, lang, S, topic, alive = () => true){
  if (synth) synth.cancel();
  if (audioEl && !unlocked) { unlocked = true; audioEl.src = SILENT; audioEl.play().catch(() => {}); }
  const src = await recordedSrc(text, lang, topic);
  if (!alive()) return;
  if (await playRecorded(src, S.rate)) return;
  if (!alive()) return;
  return speakTts(text, lang, S);
}
export function stopSpeech(){
  if (synth) synth.cancel();
  playId++;
  if (endCurrent) endCurrent();
  if (audioEl) audioEl.pause();
}
