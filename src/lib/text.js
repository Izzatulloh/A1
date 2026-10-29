// Oʻzbekcha va arabcha matn bilan ishlash: koʻrinish, qidiruv, alifbo tartibi

// Maʼlumotlarda ASCII apostrof: oʻ/gʻ uchun ʻ, tutuq belgisi uchun ʼ qilib koʻrsatamiz
export const pretty = s => s.replace(/([oOgG])'/g, "$1ʻ").replace(/'/g, "ʼ");

const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export const arNorm = s => s.replace(HARAKAT, "").replace(/[أإآٱ]/g, "ا").replace(/[؟?،,.!]/g, "").replace(/\s+/g, " ").trim();
// Alifbo tartibi uchun: harakatsiz va "ال" artiklisiz
export const arKey = s => { let n = arNorm(s); if (n.startsWith("ال") && n.length > 3) n = n.slice(2); return n; };
export const latin = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʻʼ’‘`'ʿʾ\-]/g, "");
export const HAS_AR = /[؀-ۿ]/;

const UZ_ABC = ["a","b","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","x","y","z","o'","g'","sh","ch"];
export const UZ_IDX = Object.fromEntries(UZ_ABC.map((l, i) => [l, i]));
export function uzTokens(s){
  s = s.toLowerCase().replace(/[ʻʼ’‘`]/g, "'");
  const out = [];
  for (let i = 0; i < s.length;) {
    const two = s.slice(i, i + 2);
    if (two.length === 2 && two in UZ_IDX) { out.push(two); i += 2; continue; }
    if (s[i] in UZ_IDX) out.push(s[i]);
    i++;
  }
  return out;
}

export const AR_NAMES = {"ا":"alif","ب":"bāʾ","ت":"tāʾ","ث":"thāʾ","ج":"jīm","ح":"ḥāʾ","خ":"khāʾ","د":"dāl","ذ":"dhāl","ر":"rāʾ","ز":"zāy","س":"sīn","ش":"shīn","ص":"ṣād","ض":"ḍād","ط":"ṭāʾ","ظ":"ẓāʾ","ع":"ʿayn","غ":"ghayn","ف":"fāʾ","ق":"qāf","ك":"kāf","ل":"lām","م":"mīm","ن":"nūn","ه":"hāʾ","و":"wāw","ي":"yāʾ"};

// Ovoz fayllari nomi. tools/generate-audio.js ham shu funksiyalarni ishlatadi.
export const uzSlug = s => latin(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const arSlug = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193); return (h >>> 0).toString(16).padStart(8, "0"); };
