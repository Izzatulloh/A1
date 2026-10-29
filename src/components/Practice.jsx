import {useEffect, useRef} from "react";
import {pretty} from "../lib/text.js";
import {TOPIC, TOPICS, WORDS, selectedWords} from "../lib/words.js";
import {PHASE, card, usePractice} from "../lib/usePractice.js";
import {Close, Eye, Next, Pause, Play, Prev, Repeat} from "./icons.jsx";

const DELAYS = [0, 3, 5, 7, 10, 15], GAPS = [1, 2, 3, 5];
const C = 2 * Math.PI * 52;

function Seg({name, label, value, options, onChange}){
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <span key={v} style={{display: "contents"}}>
          <input type="radio" name={name} id={name + "-" + v} value={v} checked={value === v} onChange={() => onChange(v)}/>
          <label htmlFor={name + "-" + v}>{text}</label>
        </span>
      ))}
    </div>
  );
}

function Switch({id, title, hint, checked, onChange}){
  return (
    <label className="sw-row">
      <span>{title}<small>{hint}</small></span>
      <input className="sw" type="checkbox" role="switch" id={id} checked={checked} onChange={e => onChange(e.target.checked)}/>
    </label>
  );
}

function Setup({S, update, onStart}){
  const n = selectedWords(S.topics).length;
  const per = 1.6 + S.delay + (S.sayAns ? 1.6 : 0) + S.gap;
  const min = Math.max(1, Math.round(n * per / 60));
  const uzFirst = S.dir === "uz-ar";
  const a = uzFirst ? "arabchasi" : "oʻzbekchasi";
  const tail = S.sayAns ? `${a} aytiladi` : S.showAns ? `${a} ekranda chiqadi` : "keyingi soʻzga oʻtiladi";

  const toggleTopic = id => {
    if (!id) return update({topics: []});
    let t = S.topics.includes(id) ? S.topics.filter(x => x !== id) : S.topics.concat(id);
    if (t.length === TOPICS.length) t = [];
    update({topics: t});
  };

  return (
    <section>
      <div className="hero">
        <svg className="hero-star" viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="9" width="22" height="22" rx="2"/><rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)"/></svg>
        <div className="hero-num"><strong>{n}</strong><span>ta soʻz</span><span>· taxminan {min} daqiqa</span></div>
        <p>{uzFirst ? "Oʻzbekchasi" : "Arabchasi"} aytiladi, {S.delay ? `${S.delay} soniya ichida tarjimasini topasiz, keyin` : "kutmasdan darhol"} {tail}.</p>
        <button className="btn-start" type="button" onClick={onStart}><Play size={20}/>Mashqni boshlash</button>
      </div>

      <div className="fields">
        <div>
          <div className="f-label">Mavzular</div>
          <div className="chips">
            <button className="chip" type="button" aria-pressed={!S.topics.length} onClick={() => toggleTopic("")}>Hammasi<small>{WORDS.length}</small></button>
            {TOPICS.map(t => (
              <button key={t.id} className="chip" type="button" aria-pressed={S.topics.includes(t.id)} onClick={() => toggleTopic(t.id)}>
                {pretty(t.uz)}<small>{t.n}</small>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="f-label">Yoʻnalish</div>
          <Seg name="pdir" label="Yoʻnalish" value={S.dir} onChange={dir => update({dir})}
            options={[["uz-ar", "Oʻzbekcha → Arabcha"], ["ar-uz", "Arabcha → Oʻzbekcha"]]}/>
        </div>
        <div>
          <div className="f-label">Soʻzlar tartibi</div>
          <Seg name="porder" label="Tartib" value={S.order} onChange={order => update({order})}
            options={[["topic", "Mavzu boʻyicha"], ["alpha", "Alifbo"], ["random", "Aralash"]]}/>
        </div>
        <div>
          <div className="f-label">Javobni topish uchun vaqt</div>
          <div className="chips">
            {DELAYS.map(d => <button key={d} className="chip" type="button" aria-pressed={S.delay === d} onClick={() => update({delay: d})}>{d ? `${d} soniya` : "0 · darhol"}</button>)}
          </div>
          <label className="num">Boshqa:
            <input id="delayIn" type="number" min="0" max="120" step="1" inputMode="numeric" key={S.delay} defaultValue={S.delay}
              onBlur={e => { const v = Math.round(Number(e.target.value)); if (v >= 0 && v <= 120) update({delay: v}); else e.target.value = S.delay; }}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}/>
            soniya</label>
        </div>
        <div>
          <div className="f-label">Javobdan keyin pauza</div>
          <div className="chips">
            {GAPS.map(g => <button key={g} className="chip" type="button" aria-pressed={S.gap === g} onClick={() => update({gap: g})}>{g} soniya</button>)}
          </div>
        </div>
        <div>
          <div className="f-label">Javob</div>
          <div className="panel">
            <Switch id="optSay" title="Tarjimani ovozda aytish" hint="Oʻchirsangiz, javob faqat ekranda chiqadi" checked={S.sayAns} onChange={sayAns => update({sayAns})}/>
            <Switch id="optShow" title="Tarjimani ekranda koʻrsatish" hint="Oʻchirsangiz, faqat savol soʻzi koʻrinadi" checked={S.showAns} onChange={showAns => update({showAns})}/>
            <Switch id="optTr" title="Talaffuzni koʻrsatish" hint="Masalan: kayfa hāluka" checked={S.showTr} onChange={showTr => update({showTr})}/>
          </div>
        </div>
        <div>
          <div className="f-label">Ovoz</div>
          <div className="panel">
            <div className="v-row">
              <div className="v-top"><label htmlFor="rate">Oʻqish tezligi</label><output>{S.rate.toFixed(2)}×</output></div>
              <input type="range" id="rate" min="0.5" max="1.3" step="0.05" value={S.rate} onChange={e => update({rate: +e.target.value})}/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Word({className, text, lang}){
  const ar = lang === "ar";
  const long = text.length > (ar ? 22 : 24);
  return (
    <div className={className + (ar ? " ar" : "") + (long ? " long" : "")} lang={ar ? "ar" : "uz"} dir={ar ? "rtl" : undefined}>
      {ar ? text : pretty(text)}
    </div>
  );
}

function Player({S, pr}){
  const {ui} = pr;
  const n = ui.queue.length;
  if (ui.status === "done") return (
    <div className="done">
      <div className="big-ar" lang="ar" dir="rtl">بَارَكَ اللّٰهُ فِيكَ</div>
      <h2>Mashq tugadi</h2>
      <p>{n} ta soʻz takrorlandi.</p>
      <div className="row">
        <button className="btn-solid" type="button" onClick={pr.start}>Yana bir bor</button>
        <button className="ghost" type="button" onClick={pr.stop}>Sozlamalarga qaytish</button>
      </div>
    </div>
  );
  const c = card(ui.queue[ui.i], S.dir);
  const revealed = ui.phase >= PHASE.ANSWER;
  const ringOffset = ui.phase === PHASE.WAIT && ui.total > 0 ? C * (1 - ui.left / ui.total) : 0;
  const ringNum = revealed ? "" : ui.phase === PHASE.WAIT ? Math.ceil(ui.left / 1000) : S.delay;

  return (
    <>
      <div className="bar"><span style={{width: ((ui.i + (revealed ? 1 : 0)) / n * 100) + "%"}}/></div>
      <div className="stage">
        <div className="q">
          <div className="lang-tag">{c.pLang === "uz" ? "OʻZBEKCHA" : "ARABCHA"}</div>
          <Word className="q-word" text={c.pText} lang={c.pLang}/>
          <div className="q-tr">{c.pLang === "ar" && S.showTr ? c.w.tr : ""}</div>
        </div>
        <div className={"ring-wrap" + (revealed ? " is-done" : "") + (ui.speaking ? " speaking" : "")}>
          <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ring-bg" cx="60" cy="60" r="52"/>
            <circle className="ring-fg" cx="60" cy="60" r="52" style={{strokeDashoffset: ringOffset.toFixed(2)}}/>
          </svg>
          <div className="ring-num">{ringNum}</div>
        </div>
        <div className={"a" + (revealed && S.showAns ? " shown" : "")} key={ui.i + "-" + revealed}>
          <div className="lang-tag">{c.aLang === "uz" ? "OʻZBEKCHA" : "ARABCHA"}</div>
          {revealed && S.showAns
            ? <><Word className="a-word" text={c.aText} lang={c.aLang}/><div className="a-tr">{c.aLang === "ar" && S.showTr ? c.w.tr : ""}</div></>
            : <><div className="a-word wait">{revealed ? "• • •" : "?"}</div><div className="a-tr">{revealed ? "Tarjima ekranda yashirilgan" : ""}</div></>}
        </div>
      </div>
      <div className="controls">
        <button className="ctl" type="button" aria-label="Oldingi soʻz" onClick={pr.prev}><Prev/></button>
        <button className="ctl play" type="button" aria-label={ui.paused ? "Davom ettirish" : "Pauza"} onClick={ui.paused ? pr.resume : pr.pause}>
          {ui.paused ? <Play/> : <Pause/>}
        </button>
        <button className="ctl" type="button" aria-label="Keyingi soʻz" onClick={pr.next}><Next/></button>
      </div>
      <div className="controls2">
        <button className="ghost" type="button" onClick={pr.repeat}><Repeat/>Qayta eshitish</button>
        <button className="ghost" type="button" onClick={pr.reveal}><Eye/>Javobni koʻrsat</button>
      </div>
    </>
  );
}

export default function Practice({S, update, active, onPlayingChange}){
  const pr = usePractice(S);
  const prRef = useRef(pr);
  prRef.current = pr;
  const playing = pr.ui.status !== "idle";

  useEffect(() => { onPlayingChange(playing); window.scrollTo({top: 0}); }, [playing]);
  // Boshqa boʻlimga oʻtilsa mashq pauzaga qoʻyiladi
  useEffect(() => { if (!active) prRef.current.pause(); }, [active]);

  useEffect(() => {
    if (!active || pr.ui.status !== "running") return;
    const onKey = e => {
      if (e.target.closest("input,select,textarea")) return;
      const p = prRef.current;
      if (e.code === "Space") { e.preventDefault(); p.ui.paused ? p.resume() : p.pause(); }
      else if (e.key === "ArrowRight") p.next();
      else if (e.key === "ArrowLeft") p.prev();
      else if (e.key === "Enter") p.reveal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, pr.ui.status]);

  if (!playing) return <main><Setup S={S} update={update} onStart={pr.start}/></main>;
  const w = pr.ui.queue[pr.ui.i];
  return (
    <main>
      <section className="player">
        <div className="p-top">
          <button className="icon-btn" type="button" aria-label="Mashqni toʻxtatish" onClick={pr.stop}><Close/></button>
          <div className="p-meta">
            <span id="pCounter">{pr.ui.status === "done" ? pr.ui.queue.length : pr.ui.i + 1} / {pr.ui.queue.length}</span>
            <span id="pTopic">{w ? pretty(TOPIC[w.t].uz) : ""}</span>
          </div>
          <span className="p-mode">{S.dir === "uz-ar" ? "UZ → AR" : "AR → UZ"}</span>
        </div>
        <Player S={S} pr={pr}/>
      </section>
    </main>
  );
}
