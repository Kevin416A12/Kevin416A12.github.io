// Writes voice/VOICE_LINES.md from js/lines.js and checks the 12-word limit (story panels excepted).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lines = createRequire(import.meta.url)('../js/lines.js');
let md = `# Ana — voice lines\n\nGenerated from \`js/lines.js\`. Edit that file, then run \`node tools/build_voice_lines.mjs\`.\n\n` +
  `**Character:** Ana, junior astronaut, about 11–12. Calm, capable, friendly. Not a cartoon voice.\n\n` +
  `**Recordings:** \`python3 scripts/make_voice.py\` (Kokoro-82M, voice af_heart) writes \`audio/voice/ana/<id>.mp3\` and rebuilds \`audio/voice/ana/voice.js\`. Lines without a clip use the browser voice.\n\n| id | text | mood | words |\n|---|---|---|---|\n`;
let bad = 0;
for (const [id, l] of Object.entries(lines)) { const n = l.text.split(/\s+/).length; if (n > 12 && !id.startsWith('story_')) { bad += 1; console.error('OVER 12 WORDS:', id, n); } md += `| \`${id}\` | ${l.text} | ${l.mood} | ${n} |\n`; }
writeFileSync(join(root, 'voice', 'VOICE_LINES.md'), md);
console.log(Object.keys(lines).length, 'lines written;', bad, 'over the limit'); process.exit(bad ? 1 : 0);
