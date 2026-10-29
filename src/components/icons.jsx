const stroke = {fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round"};

export const Star = ({className}) => (
  <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
    <rect x="9" y="9" width="22" height="22" rx="2"/>
    <rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)"/>
    <circle cx="20" cy="20" r="5"/>
  </svg>
);
export const Search = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
);
export const Sound = () => (
  <svg className="w-snd" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor"/>
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);
export const Play = ({size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>
);
export const Pause = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>
);
export const Prev = () => <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.4" {...stroke} aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>;
export const Next = () => <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.4" {...stroke} aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>;
export const Close = () => <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>;
export const Repeat = () => <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke} aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>;
export const Eye = () => <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke} aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
export const Book = () => <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h14v15H6.5A2.5 2.5 0 0 0 4 20.5 2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>;
export const Headphones = () => <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/></svg>;
export const Sun = () => <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
export const Moon = () => <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
