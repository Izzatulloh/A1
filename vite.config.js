import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {viteSingleFile} from "vite-plugin-singlefile";

// Hamma JS va CSS bitta index.html ichiga yigʻiladi (Claude Artifact sifatida joylash uchun).
// Ovoz fayllari (audio/uz, audio/ar) alohida, nisbiy yoʻl bilan yuklanadi.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
});
