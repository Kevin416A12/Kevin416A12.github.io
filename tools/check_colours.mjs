// Checks the bar identity colours: contrast against the panel and the bar track
// (WCAG, graphics need 3:1), and how far apart they stay under simulated
// colour-vision deficiency (Machado et al. 2009 matrices, severity 1.0).
// Run: node tools/check_colours.mjs
const cols = { Time: '#F4F1EA', Battery: '#A4E46A', Health: '#6FA8DC', 'Cost(orange)': '#E8822C' };
const panel = '#1C2E4A', track = '#09162B';
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const M = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const sim = (h, m) => { const l = rgb(h).map(lin); return m.map((row) => Math.min(1, Math.max(0, row[0] * l[0] + row[1] * l[1] + row[2] * l[2]))); };
// CIE Lab distance (Delta E 76) between two linear-RGB colours.
const lab = (l) => { const X = (0.4124 * l[0] + 0.3576 * l[1] + 0.1805 * l[2]) / 0.95047, Y = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2], Z = (0.0193 * l[0] + 0.1192 * l[1] + 0.9505 * l[2]) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; };
const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
console.log('Contrast (needs >= 3:1 for graphics)');
for (const [n, h] of Object.entries(cols)) console.log(`  ${n.padEnd(7)} ${h}  vs panel ${contrast(h, panel).toFixed(1)}:1   vs bar track ${contrast(h, track).toFixed(1)}:1`);
console.log('Colour distance between bars, Delta E (above ~20 is clearly different)');
const names = Object.keys(cols);
const PAIRS = [[0, 1], [0, 2], [1, 2], [1, 3]];
for (const mode of ['normal', 'protan', 'deutan', 'tritan']) {
  const v = Object.fromEntries(names.map((n) => [n, mode === 'normal' ? rgb(cols[n]).map(lin) : sim(cols[n], M[mode])]));
  const pairs = PAIRS.map(([i, j]) => `${names[i]}/${names[j]} ${dE(v[names[i]], v[names[j]]).toFixed(0)}`);
  console.log(`  ${mode.padEnd(7)} ${pairs.join('   ')}`);
}
