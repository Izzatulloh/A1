import {memo, useLayoutEffect, useMemo, useRef, useState} from "react";
import {AR_NAMES, HAS_AR, arNorm, latin, pretty} from "../lib/text.js";
import {TOPIC, TOPICS, WORDS, cmpAr, cmpUz, uzLetter} from "../lib/words.js";
import {speak} from "../lib/speech.js";
import {Play, Search, Sound} from "./icons.jsx";

const MODES = [
  {value: "topic", label: "Mavzular"},
  {value: "uz", label: "Alifbo A–Z"},
  {value: "ar", label: <>Alifbo <span className="ar-glyph">ا–ي</span></>},
];
const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function buildGroups(q, dmode){
  const isAr = HAS_AR.test(q), lq = latin(q), aq = arNorm(q);
  const list = !q ? WORDS : WORDS.filter(w => isAr ? w.k3.includes(aq) : (w.k1.includes(lq) || w.k2.includes(lq)));
  if (dmode === "topic") {
    return TOPICS.map(t => ({id: "t-" + t.id, topic: t, words: list.filter(w => w.t === t.id)})).filter(g => g.words.length);
  }
  const map = new Map();
  list.slice().sort(dmode === "uz" ? cmpUz : cmpAr).forEach(w => {
    const L = dmode === "uz" ? uzLetter(w) : (w.ak[0] || "?");
    if (!map.has(L)) map.set(L, []);
    map.get(L).push(w);
  });
  return [...map].map(([letter, words], i) => ({id: "l-" + i, letter, words}));
}

// Izohdagi {…} qismlar arabcha yozuvda chiqadi
export function NoteText({text}){
  return text.split(/\{(.*?)\}/).map((part, i) => i % 2
    ? <span key={i} className="n-ar" lang="ar" dir="rtl">{part}</span>
    : part);
}

const WordRow = memo(function WordRow({w, showTopic, speaking, onSpeak}){
  return (
    <li>
      <button className={"w" + (w.ar.length > 15 ? " long" : "") + (speaking ? " speaking" : "")} type="button"
        aria-label={pretty(w.uz) + ": arabchasini tinglash"} onClick={() => onSpeak(w)}>
        <span className="w-l">
          {showTopic && <span className="w-tag">{pretty(TOPIC[w.t].uz)}</span>}
          <span className="w-uz">{pretty(w.uz)}</span>
          <span className="w-tr">{w.tr}</span>
          {w.note && <span className="w-note"><NoteText text={w.note}/></span>}
        </span>
        <span className="w-ar" lang="ar" dir="rtl">{w.ar}</span>
        <Sound/>
      </button>
    </li>
  );
});

function SectionHead({g, dmode, onPractice}){
  if (g.topic) return (
    <div className="sec-head">
      <div className="sec-title">
        <h2>{pretty(g.topic.uz)}</h2>
        <span className="sec-ar" lang="ar">{g.topic.ar}</span>
        {g.topic.note && <span className="sec-sub">{g.topic.note}</span>}
      </div>
      <span className="sec-count">{g.words.length} soʻz</span>
      <button className="btn-mini" type="button" onClick={() => onPractice(g.topic.id)}><Play size={12}/>Mashq</button>
    </div>
  );
  return (
    <div className="sec-head">
      <div className="sec-title">
        {dmode === "ar"
          ? <><h2 className="letter ar" lang="ar">{g.letter}</h2><span className="sec-sub">{AR_NAMES[g.letter] || ""}</span></>
          : <h2 className="letter">{g.letter}</h2>}
      </div>
      <span className="sec-count">{g.words.length} soʻz</span>
    </div>
  );
}

export default function Dictionary({S, dmode, setDmode, onPractice}){
  const [q, setQ] = useState("");
  const [speakingId, setSpeakingId] = useState(null);
  const groups = useMemo(() => buildGroups(q.trim(), dmode), [q, dmode]);
  const toolbar = useRef(null);
  const Sref = useRef(S);
  Sref.current = S;

  // Boʻlimga oʻtganda sarlavha sticky toolbar ostida qolmasligi uchun uning balandligi
  useLayoutEffect(() => {
    const set = () => toolbar.current && document.documentElement.style.setProperty("--tb", toolbar.current.offsetHeight + "px");
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [groups]);

  const onSpeak = useMemo(() => async w => {
    setSpeakingId(w.id);
    await speak(w.ar, "ar", Sref.current, w.t);
    setSpeakingId(id => id === w.id ? null : id);
  }, []);

  const changeMode = m => { setDmode(m); window.scrollTo({top: 0}); };
  const jump = id => document.getElementById(id)?.scrollIntoView({behavior: reduced ? "auto" : "smooth", block: "start"});

  return (
    <main>
      <div className="toolbar" ref={toolbar}>
        <label className="search">
          <Search/>
          <input id="q" type="search" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Qidirish: soʻz, كلمة yoki talaffuz" autoComplete="off" aria-label="Lugʻatdan qidirish"/>
        </label>
        <div className="seg" role="radiogroup" aria-label="Koʻrinish">
          {MODES.map(m => (
            <span key={m.value} style={{display: "contents"}}>
              <input type="radio" name="dmode" id={"dm-" + m.value} value={m.value} checked={dmode === m.value} onChange={() => changeMode(m.value)}/>
              <label htmlFor={"dm-" + m.value}>{m.label}</label>
            </span>
          ))}
        </div>
        <nav className="jump" aria-label="Boʻlimga oʻtish">
          {groups.map(g => g.topic
            ? <button key={g.id} type="button" onClick={() => jump(g.id)}>{pretty(g.topic.uz)}</button>
            : <button key={g.id} type="button" className={"l" + (dmode === "ar" ? " ar" : "")} lang={dmode === "ar" ? "ar" : undefined} onClick={() => jump(g.id)}>{g.letter}</button>)}
        </nav>
      </div>
      <p className="legend">Arabcha ustunda otlar: birlik, koʻplik. Feʼllar: moziy, muzoriy, masdar.</p>
      {!groups.length && <p className="empty">“{q}” boʻyicha soʻz topilmadi.</p>}
      {groups.map(g => (
        <section className="sec" id={g.id} key={g.id}>
          <SectionHead g={g} dmode={dmode} onPractice={onPractice}/>
          {g.topic
            ? subsections(g.words).map(([sec, ws], i) => (
                <div key={i}>
                  <h3 className="sub">{sec}</h3>
                  <ul className="words">{ws.map(w => <WordRow key={w.id} w={w} showTopic={false} speaking={speakingId === w.id} onSpeak={onSpeak}/>)}</ul>
                </div>
              ))
            : <ul className="words">{g.words.map(w => <WordRow key={w.id} w={w} showTopic speaking={speakingId === w.id} onSpeak={onSpeak}/>)}</ul>}
        </section>
      ))}
    </main>
  );
}

function subsections(words){
  const subs = [];
  words.forEach(w => { if (!subs.length || subs[subs.length - 1][0] !== w.sec) subs.push([w.sec, []]); subs[subs.length - 1][1].push(w); });
  return subs;
}
