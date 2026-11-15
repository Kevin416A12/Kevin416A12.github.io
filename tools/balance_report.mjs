// Plays EVERY choice sequence for every Sun height, antenna problem and dice
// band, weighted by how likely each dice band is. Run: node tools/balance_report.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Game } = require('../js/engine.js');
const data = require('../js/data.js');
const pack = require('../js/pack_moon.js');
// Dice bands: success thresholds are 50, 70, 75 and 95%.
export const ROLLS = [[0.25, 0.5], [0.6, 0.2], [0.72, 0.05], [0.85, 0.2], [0.97, 0.05]];
export function enumerate(p = pack) {
  const tot = {}, rows = [], breach = {}; let W = 0, wins = [];
  for (const sun of p.sunScenarios) for (const fix of p.fixes) {
    const c = {}; let w = 0;
    for (const [roll, weight] of ROLLS) {
      const walk = (path) => {
        const g = new Game(p, data, 1, { sun: sun.key, fix: fix.id, roll });
        for (const x of path) g.choose(x);
        if (g.status !== 'running') { const o = g.outcome().replace('safe_data', 'safe'); c[o] = (c[o] || 0) + weight; tot[o] = (tot[o] || 0) + weight; w += weight; W += weight;
          if (g.breached) for (const b of g.breached) breach[b] = (breach[b] || 0) + weight;
          if (o === 'accomplished') wins.push({ key: `${sun.key}/${fix.id}`, path, left: { ...g.resources }, margin: Math.min(...['time', 'battery', 'health'].map((k) => (g.resources[k] - p.resources[k].reserve) / (p.resources[k].start - p.resources[k].reserve))) });
          return; }
        for (const x of g.choices()) if (!x.locked) walk([...path, x.id]);
      };
      walk([]);
    }
    rows.push({ key: `${sun.key}/${fix.id}`, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(100 * v / w)])) });
  }
  return { tot: Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, +(100 * v / W).toFixed(1)])), rows, breach, wins };
}
if (process.argv[1].endsWith('balance_report.mjs')) {
  const r = enumerate();
  for (const x of r.rows) console.log(x.key.padEnd(16), `win ${x.accomplished || 0}%`.padEnd(10), `science ${x.science || 0}%`.padEnd(13), `safe return ${x.safe || 0}%`);
  console.log('ALL (weighted %):', r.tot, ' reserve reached:', r.breach);
  const hard = r.wins.filter((w) => w.key.startsWith('0.5deg')).sort((a, b) => a.margin - b.margin)[0];
  if (hard) console.log('Hardest winning path:', hard.key, hard.path.join(' > '), JSON.stringify(hard.left));
}
