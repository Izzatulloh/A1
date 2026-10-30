// Mashq jarayoni: savol soʻz aytiladi → kutish (sanoq) → javob koʻrsatiladi/aytiladi → pauza → keyingi soʻz.
// Har bir harakat (pauza, keyingi, toʻxtatish) token'ni oshiradi; eski tsikl token oʻzgarganini koʻrib toʻxtaydi.
import {useCallback, useEffect, useRef, useState} from "react";
import {buildQueue} from "./words.js";
import {preloadTopics, speak, stopSpeech} from "./speech.js";

export const PHASE = {PROMPT: 0, WAIT: 1, ANSWER: 2, GAP: 3};

export function card(w, dir){
  const uzFirst = dir === "uz-ar";
  return {w, pText: uzFirst ? w.uz : w.ar, pLang: uzFirst ? "uz" : "ar", aText: uzFirst ? w.ar : w.uz, aLang: uzFirst ? "ar" : "uz"};
}

function timer(ms, alive, onTick){
  return new Promise(res => {
    const end = performance.now() + ms;
    const tick = () => {
      if (!alive()) return res();
      const left = Math.max(0, end - performance.now());
      if (onTick) onTick(left);
      if (left <= 0) return res();
      setTimeout(tick, 50);
    };
    tick();
  });
}

// Mashq paytida ekran oʻchib qolmasin
let wake = null;
async function wakeOn(){ try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } } catch (e) { wake = null; } }
function wakeOff(){ try { if (wake) wake.release(); } catch (e) {} wake = null; }

const IDLE = {status: "idle", queue: [], i: 0, phase: PHASE.PROMPT, left: 0, total: 1, speaking: false, paused: false};

export function usePractice(S){
  const Sref = useRef(S);
  Sref.current = S;
  const P = useRef({queue: [], i: 0, phase: 0, remain: null, paused: false, running: false, token: 0});
  const [ui, setUi] = useState(IDLE);
  const patch = p => setUi(u => ({...u, ...p}));

  const finish = useCallback(() => {
    const p = P.current;
    p.running = false; p.paused = false; wakeOff();
    patch({status: "done", paused: false, speaking: false});
  }, []);

  const runFrom = useCallback(async (phase, remain = null) => {
    const p = P.current;
    const my = ++p.token, alive = () => my === p.token;
    p.paused = false; p.running = true;
    patch({paused: false, status: "running"});
    wakeOn();
    while (p.i < p.queue.length) {
      const S = Sref.current, c = card(p.queue[p.i], S.dir), total = S.delay * 1000;
      if (phase <= PHASE.PROMPT) {
        p.phase = PHASE.PROMPT;
        patch({i: p.i, phase: PHASE.PROMPT, left: total, total, speaking: true});
        await speak(c.pText, c.pLang, S, c.w.t, alive);
        if (!alive()) return;
        patch({speaking: false});
      }
      // 0 soniya tanlangan boʻlsa kutmasdan darhol javobga oʻtiladi
      if (phase <= PHASE.WAIT && total > 0) {
        p.phase = PHASE.WAIT;
        patch({i: p.i, phase: PHASE.WAIT, total});
        await timer(remain != null ? remain : total, alive, left => { p.remain = left; patch({left}); });
        if (!alive()) return;
      }
      if (phase <= PHASE.ANSWER) {
        p.phase = PHASE.ANSWER;
        patch({i: p.i, phase: PHASE.ANSWER});
        if (S.sayAns) { await speak(c.aText, c.aLang, S, c.w.t, alive); if (!alive()) return; }
      }
      // Pauza 0 boʻlsa javobdan keyin darhol keyingi soʻzga oʻtiladi
      if (S.gap > 0) {
        p.phase = PHASE.GAP;
        patch({phase: PHASE.GAP});
        await timer(S.gap * 1000, alive);
        if (!alive()) return;
      }
      p.i++; phase = PHASE.PROMPT; remain = null;
    }
    finish();
  }, [finish]);

  const halt = useCallback(() => { P.current.token++; stopSpeech(); patch({speaking: false}); }, []);

  const api = {
    ui,
    start(){
      const p = P.current;
      p.queue = buildQueue(Sref.current); p.i = 0; p.remain = null;
      if (!p.queue.length) return;
      preloadTopics([...new Set(p.queue.map(w => w.t))]);
      setUi({...IDLE, status: "running", queue: p.queue});
      runFrom(PHASE.PROMPT);
    },
    pause(){
      const p = P.current;
      if (!p.running || p.paused) return;
      halt(); p.paused = true; wakeOff();
      patch({paused: true});
    },
    resume(){
      const p = P.current;
      if (p.phase === PHASE.WAIT) runFrom(PHASE.WAIT, p.remain);
      else runFrom(p.phase);
    },
    go(i){
      const p = P.current;
      halt(); p.i = Math.max(0, Math.min(p.queue.length - 1, i)); p.remain = null;
      runFrom(PHASE.PROMPT);
    },
    next(){ const p = P.current; if (p.i >= p.queue.length - 1) { halt(); finish(); } else api.go(p.i + 1); },
    prev(){ api.go(P.current.i - 1); },
    repeat(){ halt(); P.current.remain = null; runFrom(PHASE.PROMPT); },
    reveal(){ if (P.current.phase <= PHASE.WAIT) { halt(); runFrom(PHASE.ANSWER); } },
    stop(){ const p = P.current; halt(); p.running = false; p.paused = false; wakeOff(); setUi(IDLE); },
  };

  useEffect(() => {
    const onVis = () => { const p = P.current; if (document.visibilityState === "visible" && p.running && !p.paused) wakeOn(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); P.current.token++; stopSpeech(); wakeOff(); };
  }, []);

  return api;
}
