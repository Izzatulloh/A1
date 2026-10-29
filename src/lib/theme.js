// Kun/tun rejimi: standart holatda qurilmaga qarab ("system"); tugma bosilsa "light" yoki "dark".
// Tanlov <html data-mode> ga yoziladi va shu brauzerda eslab qolinadi; "system" da atribut boʻlmaydi.
import {useEffect, useState} from "react";

const KEY = "kalima.theme";
export const MODES = ["system", "light", "dark"];

function read(){
  try { const m = localStorage.getItem(KEY); return MODES.includes(m) ? m : "system"; } catch (e) { return "system"; }
}
function apply(mode){
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-mode"); else root.setAttribute("data-mode", mode);
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = dark ? "#0B1412" : "#F2F5F3"; });
}

// Qaytaradi: hozir qorongʻimi va almashtirish funksiyasi. Bosilganda qarama-qarshi rejim tanlanadi va eslab qolinadi.
export function useTheme(){
  const [mode, setMode] = useState(read);
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const [systemDark, setSystemDark] = useState(mq.matches);
  useEffect(() => {
    apply(mode);
    try { mode === "system" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, mode); } catch (e) {}
    const onChange = () => { setSystemDark(mq.matches); if (mode === "system") apply("system"); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);
  const dark = mode === "dark" || (mode === "system" && systemDark);
  return [dark, () => setMode(dark ? "light" : "dark")];
}
