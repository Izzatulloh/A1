// dist/index.html → dist/artifact.html: Claude Artifact sahifani oʻzi <html>/<head>/<body> ichiga oladi,
// shuning uchun bu teglar va charset/viewport meta olib tashlanadi.
import fs from "node:fs";

let html = fs.readFileSync("dist/index.html", "utf8");
html = html
  .replace(/<!doctype html>/i, "")
  .replace(/<\/?html[^>]*>/gi, "")
  .replace(/<\/?head>/gi, "")
  .replace(/<\/?body>/gi, "")
  .replace(/<meta charset="[^"]*">/i, "")
  .replace(/<meta name="viewport"[^>]*>/i, "");
// <title> sahifaning birinchi 8 KB ichida boʻlishi kerak
const title = html.match(/<title>.*?<\/title>/)[0];
html = title + "\n" + html.replace(title, "").trim() + "\n";
fs.writeFileSync("dist/artifact.html", html);
console.log(`dist/artifact.html: ${(html.length / 1024).toFixed(0)} KB`);
