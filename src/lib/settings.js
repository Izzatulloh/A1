// Sozlamalar brauzer xotirasida (localStorage) saqlanadi; xotira yopiq boʻlsa ham ilova ishlayveradi
import {useEffect, useState} from "react";
import {TOPIC} from "./words.js";

const KEY = "kalima.v1";
export const DEFAULTS = {topics: [], dir: "uz-ar", order: "topic", delay: 3, gap: 2, sayAns: true, showAns: true, showTr: true, rate: 0.9, uzVoice: "", arVoice: ""};

function load(){
  const S = {...DEFAULTS};
  let d = "topic";
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || "null");
    if (r && typeof r === "object") { Object.assign(S, r.s || {}); if (["topic", "uz", "ar"].includes(r.d)) d = r.d; }
  } catch (e) {}
  S.topics = Array.isArray(S.topics) ? S.topics.filter(id => TOPIC[id]) : [];
  S.delay = Number.isFinite(Number(S.delay)) ? Math.min(120, Math.max(0, Math.round(Number(S.delay)))) : 3;
  return {S, d};
}

export function useSettings(){
  const [init] = useState(load);
  const [S, setS] = useState(init.S);
  const [dmode, setDmode] = useState(init.d);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({s: S, d: dmode})); } catch (e) {}
  }, [S, dmode]);
  const update = patch => setS(prev => ({...prev, ...patch}));
  return {S, update, dmode, setDmode};
}
