import {useEffect, useState} from "react";
import Dictionary from "./components/Dictionary.jsx";
import Practice from "./components/Practice.jsx";
import {Book, Headphones, Moon, Star, Sun} from "./components/icons.jsx";
import {useSettings} from "./lib/settings.js";
import {useTheme} from "./lib/theme.js";
import {WORDS} from "./lib/words.js";

// Ikki sahifa: #lugat (lugʻat) va #mashq (tinglab yodlash)
const viewFromHash = () => (location.hash === "#mashq" ? "mashq" : "lugat");

export default function App(){
  const {S, update, dmode, setDmode} = useSettings();
  const [view, setView] = useState(viewFromHash);
  const [playing, setPlaying] = useState(false);
  const [dark, toggleTheme] = useTheme();

  useEffect(() => {
    const onHash = () => { setView(viewFromHash()); window.scrollTo({top: 0}); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const practiceTopic = id => { update({topics: [id]}); location.hash = "mashq"; };

  return (
    <>
      <div className="shell">
        {!(view === "mashq" && playing) && (
          <header className="brand">
            <Star className="star"/>
            <div className="brand-text">
              <h1>Kalima <span className="brand-ar" lang="ar">كَلِمَة</span></h1>
              <p>Al-Manhaj al-ʻĀlamiy A1 · {WORDS.length} soʻz va ibora</p>
            </div>
            <button className="theme-btn" type="button" onClick={toggleTheme}
              title={dark ? "Kunduzgi rejimga oʻtish" : "Tungi rejimga oʻtish"} aria-label={dark ? "Kunduzgi rejimga oʻtish" : "Tungi rejimga oʻtish"}>
              {dark ? <Moon/> : <Sun/>}
            </button>
          </header>
        )}
        <div hidden={view !== "lugat"}>
          <Dictionary S={S} dmode={dmode} setDmode={setDmode} onPractice={practiceTopic}/>
        </div>
        <div hidden={view !== "mashq"}>
          <Practice S={S} update={update} active={view === "mashq"} onPlayingChange={setPlaying}/>
        </div>
      </div>
      <nav className="tabbar" aria-label="Boʻlimlar">
        <div className="in">
          <a className="tab" href="#lugat" aria-current={view === "lugat" ? "page" : undefined}><Book/>Lugʻat</a>
          <a className="tab" href="#mashq" aria-current={view === "mashq" ? "page" : undefined}><Headphones/>Tinglab yodlash</a>
        </div>
      </nav>
    </>
  );
}
