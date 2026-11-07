// Bundles index.html, css/ and js/ into one self-contained file: dist/index.html.
// Use the bundle for hosts that want a single file (Netlify Drop, IIS, SharePoint, email).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let html = readFileSync(join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, href) =>
  `<style>\n${readFileSync(join(root, href), 'utf8')}</style>`);

const scripts = [];
html = html.replace(/<script src="(js\/[^"]+)"><\/script>\n?/g, (_, src) => {
  scripts.push(`/* ===== ${src} ===== */\n${readFileSync(join(root, src), 'utf8')}`);
  return '';
});
// Each source file is strict-mode and shares one global scope, so a single <script> keeps the same behaviour.
// A function replacement, so '$' sequences in the code are not treated as replacement patterns.
const bundle = scripts.join('\n').replace(/<\/script/gi, '<\\/script');
html = html.replace('</body>', () => `<script>\n${bundle}</script>\n</body>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'index.html'), html);
console.log(`dist/index.html written: ${scripts.length} scripts inlined, ${(html.length / 1024).toFixed(0)} KB`);
