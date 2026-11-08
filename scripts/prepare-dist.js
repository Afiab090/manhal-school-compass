import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const outputPublicDir = path.join(rootDir, ".output", "public");
const distDir = path.join(rootDir, "dist");

console.log("[prepare-dist] Copying static web assets from .output/public to dist...");

if (fs.existsSync(outputPublicDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.cpSync(outputPublicDir, distDir, { recursive: true });

  const shellHtml = path.join(distDir, "_shell.html");
  const indexHtml = path.join(distDir, "index.html");

  if (fs.existsSync(shellHtml) && !fs.existsSync(indexHtml)) {
    fs.copyFileSync(shellHtml, indexHtml);
    console.log("[prepare-dist] Copied _shell.html to index.html for Capacitor webDir.");
  } else if (!fs.existsSync(indexHtml)) {
    console.warn("[prepare-dist] Warning: index.html not found, checking alternatives...");
  }
  console.log("[prepare-dist] dist directory successfully prepared for Capacitor.");
} else {
  console.warn("[prepare-dist] .output/public directory not found. Did vite build succeed?");
}
