// Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Game, routeLeg } = require('../js/engine.js');
const data = require('../js/data.js');
const pack = require('../js/pack_moon.js');
const lines = require('../js/lines.js');
const { enumerate } = await import('../tools/balance_report.mjs');
const play = (path, force) => { const g = new Game(pack, data, 1, Object.assign({ sun: '1.0deg', fix: 'bent', roll: 0.6 }, force)); let arr; for (const c of path) { const r = g.choose(c); assert.ok(r.ok, c); if (r.arrival) arr = r.arrival; } return { g, arr }; };

test('DONKI bundle matches the downloaded files', () => {
  assert.equal(data.donki.flare_total, 148);
  assert.deepEqual(data.donki.flare_class_counts, { C: 3, M: 127, X: 18 });
  assert.equal(data.donki.sep_total, 14);
});
test('road time comes from measured length and SCOUT speed', () => {
  for (const id of Object.keys(pack.routes)) {
    const leg = routeLeg(pack, data, { sun: pack.sunScenarios[0] }, id, { leg: 'out' });
    assert.ok(Math.abs(leg.driveH - data.routes.routes[id].drive_hours_at_prospecting_speed) < 0.02);
  }
});
test('flatter road: longer, sunnier, gentler on Battery and Health', () => {
  for (const s of pack.sunScenarios) { const L = (id) => routeLeg(pack, data, { sun: s }, id, { leg: 'out' });
    assert.ok(L('flattest').hours > L('direct').hours && L('flattest').battery < L('direct').battery && L('flattest').health < L('balanced').health && L('balanced').health < L('direct').health); }
});
test('the trip home costs more Battery than the trip out, on every road and day', () => {
  for (const s of pack.sunScenarios) for (const id of Object.keys(pack.routes)) {
    const out = routeLeg(pack, data, { sun: s }, id, { leg: 'out' }), home = routeLeg(pack, data, { sun: s }, id, { leg: 'home', includeShadow: true });
    assert.ok(home.battery > out.battery, `${s.key} ${id}`);
  }
});
test('no oxygen: the bars are Time, Battery, Health', () => { assert.deepEqual(Object.keys(pack.resources), ['time', 'battery', 'health']); });
test('decision 1 is a demonstration with a single choice', () => { const g = new Game(pack, data, 1); assert.equal(g.event.demo, true); assert.equal(g.choices().length, 1); });
test('solar storm only ever offers two shelters', () => {
  const { g } = play(['locate', 'balanced', 'wait']); assert.deepEqual(g.choices().map((c) => c.id), ['crater', 'boulder']);
});
test("ORION's signal: fastest and safest runs arrive in time, a careless run does not", () => {
  const fast = play(['locate', 'direct', 'drive', 'boulder']), safe = play(['locate', 'flattest', 'drive', 'boulder']), slow = play(['locate', 'flattest', 'booster', 'crater']);
  assert.equal(fast.arr.signalOn, true); assert.equal(safe.arr.signalOn, true); assert.ok(safe.g.signal < fast.g.signal);
  assert.equal(slow.arr.signalOn, false); assert.equal(slow.g.status, 'running');
  assert.ok(Math.abs(slow.arr.search.time - pack.signal.search_h) < 1e-9);
});
test('rescue: the fix is always offered; the booster link is locked unless the booster was built', () => {
  const no = play(['locate', 'balanced', 'wait', 'boulder', 'copy']).g, yes = play(['locate', 'balanced', 'booster', 'boulder', 'copy']).g;
  assert.deepEqual(no.choices().map((c) => c.id), ['fix', 'leave', 'link']);
  assert.equal(no.choices()[2].locked, true); assert.equal(no.choose('link').ok, false);
  assert.equal(yes.choices()[2].locked, false);
  yes.choose('link'); assert.equal(yes.flags.repaired, true);
});
test('without a check-up the fix shows a range and the real cost lies inside it', () => {
  for (const f of pack.fixes) { const g = play(['locate', 'balanced', 'wait', 'boulder', 'copy'], { fix: f.id, roll: 0.1 }).g; const c = g.choices()[0];
    assert.equal(c.preview, null); assert.ok(c.cost.time >= c.range.time[0] && c.cost.time <= c.range.time[1]); assert.ok(c.cost.battery >= c.range.battery[0] && c.cost.battery <= c.range.battery[1]); }
  const k = play(['locate', 'balanced', 'wait', 'boulder', 'checkup']).g.choices()[0]; assert.ok(k.preview && !k.range);
});
test('check-up and booster raise the success chance; a failed fix still saves the data', () => {
  const ch = (p) => play(p).g.choices()[0].chance;
  assert.ok(ch(['locate', 'balanced', 'wait', 'boulder', 'checkup']) > ch(['locate', 'balanced', 'wait', 'boulder', 'copy']));
  assert.ok(ch(['locate', 'balanced', 'booster', 'boulder', 'checkup']) > ch(['locate', 'balanced', 'wait', 'boulder', 'checkup']));
  const g = play(['locate', 'balanced', 'wait', 'boulder', 'checkup', 'fix'], { roll: 0.99 }).g; assert.equal(g.flags.repaired, false); assert.equal(g.flags.data, true);
});
test('same seed gives the same day, dice roll included', () => { assert.deepEqual(new Game(pack, data, 42).scenario, new Game(pack, data, 42).scenario); });
test('option labels and Ana lines are 12 words or fewer (story panels excepted)', () => {
  for (const [id, l] of Object.entries(lines)) if (!id.startsWith('story_')) assert.ok(l.text.split(/\s+/).length <= 12, id);
  const g = new Game(pack, data, 1); while (g.status === 'running') { const cs = g.choices(); for (const c of cs) assert.ok(c.label.split(/\s+/).length <= 12); g.choose(cs[0].id); }
});
test('balance: every day is winnable, the full win is a minority, safe returns are real', () => {
  const r = enumerate();
  for (const row of r.rows) assert.ok((row.accomplished || 0) > 0, row.key);
  assert.ok(r.tot.accomplished < 40 && r.tot.safe > 15, JSON.stringify(r.tot));
});
