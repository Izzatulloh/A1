// Lugʻat: Al-Manhaj al-ʻĀlamiy A1, 1–4-boʻlimlar.
// topics.json: mavzu → boʻlimlar → [oʻzbekcha, arabcha, oʻqilishi, izoh]; izohdagi {…} arabcha
import TOPICS from "../data/topics.json";
import {UZ_IDX, arKey, arNorm, latin, uzTokens} from "./text.js";

export {TOPICS};
export const WORDS = [];
TOPICS.forEach(t => {
  t.n = 0;
  t.s.forEach(([sec, ws]) => ws.forEach(([uz, ar, tr, note = ""]) => {
    const tok = uzTokens(uz);
    t.n++;
    WORDS.push({id: WORDS.length, uz, ar, tr, note, sec, t: t.id, tok, ui: tok.map(x => UZ_IDX[x]), ak: arKey(ar), k1: latin(uz), k2: latin(tr), k3: arNorm(ar)});
  }));
});
export const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));

export function cmpUz(a, b){
  const n = Math.min(a.ui.length, b.ui.length);
  for (let i = 0; i < n; i++) if (a.ui[i] !== b.ui[i]) return a.ui[i] - b.ui[i];
  return a.ui.length - b.ui.length;
}
export const cmpAr = (a, b) => a.ak.localeCompare(b.ak, "ar");
export const uzLetter = w => { const t = w.tok[0] || "?"; return t[0].toUpperCase() + t.slice(1).replace("'", "ʻ"); };

export const selectedWords = topics => WORDS.filter(w => !topics.length || topics.includes(w.t));

export function buildQueue(S){
  const ws = selectedWords(S.topics).slice();
  if (S.order === "alpha") ws.sort(S.dir === "uz-ar" ? cmpUz : cmpAr);
  else if (S.order === "random") for (let i = ws.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ws[i], ws[j]] = [ws[j], ws[i]]; }
  return ws;
}
