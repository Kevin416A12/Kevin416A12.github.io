// Junior Astronaut Mission Trainer — Saving Rover Orion: interface (v0.7).
// Rules live in engine.js, wording in pack_moon.js and lines.js, drawings in art.js,
// audio file names in the three manifests under /audio.
(function () {
  'use strict';
  const D = window.SRO_DATA, P = window.SRO_PACK_MOON, E = window.SRO_ENGINE, LINES = window.SRO_LINES, A = window.SRO_ART;
  const MUSIC = window.SRO_MUSIC || {}, SFX = window.SRO_SFX || {}, VOICE = window.SRO_VOICE || {};
  const $ = (id) => document.getElementById(id);
  const RES = E.RES, ICON = A.ICON, Game = E.Game;
  const NAME = { time: 'Time', battery: 'Battery', health: 'Health' };
  const TAG = { nasa: 'NASA data', model: 'Our calculation from NASA data', game: 'Game value', story: 'Story' };
  const TAGICON = { nasa: 'sat', model: 'scan', game: 'star', story: 'ask' };
  const qs = new URLSearchParams(location.search);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (k, v) => Math.abs(v).toFixed(P.resources[k].decimals);
  const S = { game: null, seed: 1, sel: null, busy: false, sound: true, voiceOn: true, musicOn: true, musicVol: 0.35, lowfx: false, calm: false, unlocked: false,
    asked: 0, right: 0, streak: 0, runBadges: new Set(), shelf: new Set(), shown: {}, sigShown: 0, firstPlay: true, quizDone: false, nasaSaid: false, sigLowSaid: false, choices: [] };
  try { S.firstPlay = !localStorage.getItem('sro_played'); (JSON.parse(sessionStorage.getItem('sro_shelf') || '[]')).forEach((b) => S.shelf.add(b)); } catch (e) { /* storage is optional */ }
  const quick = () => S.calm || S.lowfx;
  const wait = (ms) => new Promise((r) => setTimeout(r, quick() ? Math.min(ms, 60) : ms));
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* not supported */ }

  // ---------- sound effects: manifest file if listed, else a synthesised beep ----------
  // Everything heard is SCOUT's radio and telemetry; no sound travels through vacuum.
  let actx = null;
  function tone(freq, dur, type, vol, when) {
    if (!S.sound || !S.unlocked) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime + (when || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.06);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) { /* sound is optional */ }
  }
  const EXT = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? '.ogg' : '.mp3'; } catch (e) { return '.mp3'; } })();
  const SYNTH = {
    tap: () => tone(520, 0.07, 'triangle', 0.045), select: () => { tone(660, 0.07, 'triangle', 0.045); tone(880, 0.05, 'triangle', 0.03, 0.05); },
    spend: (i) => tone(380 - i * 40, 0.12, 'sine', 0.04), ping: (f) => tone(1040, 0.07, 'sine', 0.035, f),
    go: () => { tone(523, 0.1, 'sine', 0.06); tone(784, 0.16, 'sine', 0.06, 0.1); }, warning: () => { tone(440, 0.1, 'triangle', 0.05); tone(440, 0.1, 'triangle', 0.05, 0.16); },
    win: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.22, 'sine', 0.07, i * 0.12)); }, lose: () => { tone(392, 0.18, 'sine', 0.05); tone(330, 0.24, 'sine', 0.05, 0.16); tone(440, 0.16, 'sine', 0.04, 0.5); },
    found: () => { [659, 784, 659, 988].forEach((f, i) => tone(f, 0.14, 'square', 0.035, i * 0.15)); }, unlock: () => { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.1, 'sine', 0.05, i * 0.07)); },
    badge: () => { tone(880, 0.1, 'sine', 0.06); tone(1175, 0.2, 'sine', 0.06, 0.09); }, storm: () => { [0, 0.4, 0.8].forEach((w, i) => tone(600 + i * 90, 0.2, 'triangle', 0.05, w)); },
    ratchet: (i) => tone(1800, 0.03, 'square', 0.03, i * 0.22), pop: () => tone(700, 0.06, 'sine', 0.04),
  };
  function sfx(name, arg) {
    if (!S.sound || !S.unlocked) return;
    const m = SFX[name];
    if (m && m.file) { try { const a = new Audio('audio/sfx/' + m.file + EXT); a.volume = m.volume == null ? 0.5 : m.volume; a.onerror = () => { if (SYNTH[name]) SYNTH[name](arg); }; const p = a.play(); if (p && p.catch) p.catch(() => {}); return; } catch (e) { /* fall through */ } }
    if (SYNTH[name]) SYNTH[name](arg);
  }

  // ---------- music: one looping track per state, 2 s crossfade, ducked under Ana ----------
  const Music = { cur: null, state: null, duck: 1 };
  function musicVolume(a) { if (a) a.volume = Math.max(0, Math.min(1, (S.sound && S.musicOn ? S.musicVol : 0) * (a._base || 1) * (a._fade == null ? 1 : a._fade) * Music.duck)); }
  function setMusic(state) {
    if (Music.state === state) return; Music.state = state;
    const old = Music.cur, m = MUSIC[state]; let nu = null;
    if (m && m.file && S.unlocked) { try { nu = new Audio('audio/music/' + m.file); nu.loop = true; nu._base = m.volume == null ? 1 : m.volume; nu._fade = 0; nu.onerror = () => {}; musicVolume(nu); const p = nu.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { nu = null; } }
    Music.cur = nu; const t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 2000); if (nu) { nu._fade = k; musicVolume(nu); } if (old) { old._fade = 1 - k; musicVolume(old); } if (k < 1) setTimeout(step, 80); else if (old) old.pause(); };
    step();
  }
  function duck(on) { Music.duck = on ? 0.4 : 1; musicVolume(Music.cur); } // about -8 dB

  // ---------- Ana's voice: recorded clip if listed in the manifest, else browser speech ----------
  const Voice = { voice: null, name: 'none found yet', audio: null, token: 0 };
  function pickVoice() {
    if (!('speechSynthesis' in window)) { Voice.name = 'speech not supported in this browser'; return; }
    const vs = speechSynthesis.getVoices(); if (!vs.length) return;
    const us = vs.filter((v) => /^en[-_]US/i.test(v.lang)), en = vs.filter((v) => /^en/i.test(v.lang));
    const female = /samantha|ava|allison|susan|zoe|nicky|joelle|noelle|victoria|karen|moira|tessa|jenny|aria|zira|female|google us english/i;
    Voice.voice = us.find((v) => /enhanced|premium/i.test(v.name)) || us.find((v) => /samantha/i.test(v.name)) || us.find((v) => female.test(v.name)) || us[0] || en.find((v) => female.test(v.name)) || en[0] || null;
    Voice.name = Voice.voice ? `${Voice.voice.name} (${Voice.voice.lang})` : 'no English voice installed';
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function hush() { Voice.token += 1; try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } if (Voice.audio) { Voice.audio.pause(); Voice.audio = null; } duck(false); }
  function speak(ids) {
    hush(); if (!S.sound || !S.voiceOn || !S.unlocked) return;
    const my = Voice.token; let i = 0; duck(true);
    const next = () => {
      if (my !== Voice.token) return; if (i >= ids.length) { duck(false); return; }
      const id = ids[i++], text = LINES[id].text;
      if (VOICE[id]) { const a = new Audio('audio/voice/ana/' + VOICE[id]); Voice.audio = a; a.onended = next; a.onerror = () => tts(text, next); const p = a.play(); if (p && p.catch) p.catch(() => tts(text, next)); } else tts(text, next);
    };
    const tts = (text, done) => { if (!('speechSynthesis' in window)) { duck(false); return; } const u = new SpeechSynthesisUtterance(text); if (Voice.voice) u.voice = Voice.voice; u.lang = 'en-US'; u.rate = 0.95; u.pitch = 1.1; u.onend = done; u.onerror = () => duck(false); speechSynthesis.speak(u); };
    next();
  }
  function say(ids, opts) {
    ids = [].concat(ids); const o = opts || {};
    $('caption').textContent = ids.map((id) => LINES[id].text).join(' ');
    setAna(o.mood || LINES[ids[ids.length - 1]].mood, o.look, o.big); speak(ids);
  }
  function setAna(mood, look, big) { const p = $('portrait'); p.innerHTML = A.ana(mood, look); p.classList.remove('react', 'jump'); void p.offsetWidth; p.classList.add(big ? 'jump' : 'react'); }

  // ---------- bars ----------
  function buildHud() {
    $('hud').innerHTML = RES.map((k) => { const r = P.resources[k];
      return `<div class="res t-${k}" id="res-${k}"><div class="res-head">${ICON[k]}<span class="res-name">${r.label}</span><span class="res-flag">${ICON.warn}<span id="flagtxt-${k}"></span></span>
        <span class="res-val"><span id="val-${k}"></span><small>${r.unit}</small></span></div>
        <div class="bar" role="meter" aria-label="${r.label}" aria-valuemin="0" aria-valuemax="${r.start}" id="meter-${k}"><div class="bar-clip"><div class="bar-fill" id="fill-${k}"></div><div class="bar-ghost" id="ghost-${k}"></div>
        <div class="bar-reserve" style="width:${(100 * r.reserve / r.start).toFixed(1)}%"></div></div><div class="bar-home" id="home-${k}"></div></div></div>`; }).join('');
    for (const k of RES) S.shown[k] = P.resources[k].start;
  }
  function tween(from, to, ms, draw) {
    if (quick() || ms < 30) { draw(to); return; }
    const t0 = performance.now(); const step = (t) => { const p = Math.min(1, (t - t0) / ms); draw(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  }
  function updateHud(vals, animate) {
    const g = S.game; vals = vals || g.resources;
    const need = g.status === 'running' && g.arrived ? g.homeNeed() : null;
    RES.forEach((k, i) => {
      const r = P.resources[k], v = vals[k], from = S.shown[k];
      const apply = () => {
        $('fill-' + k).style.width = Math.max(0, Math.min(100, 100 * v / r.start)).toFixed(1) + '%';
        tween(from, v, 800, (x) => { $('val-' + k).textContent = fmt(k, Math.max(0, x)); });
        $('meter-' + k).setAttribute('aria-valuenow', v);
        if (animate && Math.abs(from - v) > 0.05) { const f = document.createElement('span'); f.className = 'float'; f.textContent = (v < from ? '−' : '+') + fmt(k, from - v) + ' ' + r.unit; $('res-' + k).appendChild(f); setTimeout(() => f.remove(), 1900); sfx('spend', i); }
      };
      if (animate) setTimeout(apply, quick() ? 0 : i * 250); else apply();
      S.shown[k] = v;
      const usable = (v - r.reserve) / (r.start - r.reserve); let st = '', txt = '';
      if (v < r.reserve - 1e-9) { st = 'crit'; txt = 'Reserve reached'; } else if (need && v - need[k] < r.reserve - 1e-9) { st = 'crit'; txt = 'Not enough to get home'; } else if (usable <= 0.3) { st = 'warn'; txt = 'Getting low'; }
      $('res-' + k).className = `res t-${k} ${st}`; $('flagtxt-' + k).textContent = txt;
      const flag = $('home-' + k); if (need) { flag.style.left = Math.min(100, 100 * (r.reserve + need[k]) / r.start).toFixed(1) + '%'; flag.classList.add('on'); } else flag.classList.remove('on');
    });
  }
  // Ghost preview: where each bar would land. An unknown cost draws an orange range segment.
  function ghost(c) {
    const g = S.game;
    for (const k of RES) {
      const el = $('ghost-' + k), r = P.resources[k], v = g.resources[k];
      if (!c) { el.className = 'bar-ghost'; continue; }
      const s = Game.shown(c);
      if (!s && c.range && c.range[k]) { const lo = v - c.range[k][1], hi = v - c.range[k][0]; el.style.left = (100 * Math.max(0, lo) / r.start).toFixed(1) + '%'; el.style.width = (100 * (v - Math.max(0, lo)) / r.start).toFixed(1) + '%'; el.className = 'bar-ghost on range'; el.title = hi; continue; }
      if (!s) { el.className = 'bar-ghost'; continue; }
      const p = Math.max(0, Math.min(r.start, v - s[k])); if (Math.abs(v - p) < 0.05) { el.className = 'bar-ghost'; continue; }
      el.style.left = (100 * Math.min(v, p) / r.start).toFixed(1) + '%'; el.style.width = (100 * Math.abs(v - p) / r.start).toFixed(1) + '%';
      el.className = 'bar-ghost on' + (p < r.reserve - 1e-9 ? ' breach' : '');
    }
    updateSignal(c && !g.arrived && Game.shown(c) ? Math.max(0, g.signal - Game.shown(c).time) : null);
  }
  function updateSignal(preview) {
    const g = S.game, el = $('signal'), b = g.signal; let cls = 'signal', val;
    if (g.arrived) { cls += g.signalOnAtArrival ? ' found' : ' dead'; val = g.signalOnAtArrival ? 'ORION found' : 'Signal lost'; }
    else { if (b / P.signal.start <= P.signal.low_fraction) cls += ' low'; val = preview != null && Math.abs(preview - b) > 0.004 ? `${b.toFixed(1)} → ${preview.toFixed(1)} h` : `${b.toFixed(1)} h left`; }
    el.className = cls; el.innerHTML = `<span class="b-ic">${ICON.signal}</span><span class="b-lab">ORION's signal</span><span class="b-val" id="b-val">${val}</span>`;
    el.setAttribute('aria-label', "ORION's signal: " + val);
  }
  // Signal countdown: the timer comes to the centre, counts down with pings that slow as it weakens.
  async function signalCountdown(from, to) {
    const low = to / P.signal.start <= P.signal.low_fraction;
    if (quick()) { $('signal').classList.add('pulse'); updateSignal(); setTimeout(() => $('signal').classList.remove('pulse'), 700); }
    else {
      const fx = $('sigfx'); let skip = false; fx.onclick = () => { skip = true; };
      fx.innerHTML = `<div class="sigbig ${low ? 'low' : ''}">${ICON.signal}<b id="sig-n">${from.toFixed(1)} h</b><span>ORION's signal${to <= 0 ? ' is lost' : low ? ' is getting weak' : ''}</span></div>`; fx.classList.add('on');
      const gap = 0.16 + (1 - to / P.signal.start) * 0.3; [0, 1, 2, 3].forEach((i) => sfx('ping', i * gap));
      await new Promise((r) => { const t0 = performance.now(); const step = (t) => { const p = skip ? 1 : Math.min(1, (t - t0 - 500) / 1200); const n = $('sig-n'); if (n && p >= 0) n.textContent = (from + (to - from) * p).toFixed(1) + ' h'; if (p < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
      if (!skip) await wait(500); fx.classList.remove('on'); updateSignal();
    }
    if (low && to > 0 && !S.sigLowSaid) { S.sigLowSaid = true; return true; }
    return false;
  }
  function progress() {
    const g = S.game, n = Math.min(g.index, 6), ev = P.events[n], l1 = P.events.filter((e) => e.level === 1).length, lv = g.arrived || n >= l1 ? 2 : 1;
    const step = lv === 1 ? n + 1 : n - l1 + 1, of = lv === 1 ? l1 : P.events.length - l1;
    const x = (i) => 12 + i * (276 / 7);
    let dots = ''; for (let i = 0; i <= 7; i++) dots += `<circle cx="${x(i)}" cy="12" r="${i === 0 || i === 4 || i === 7 ? 5 : 3}" fill="${i <= g.index ? '#A4E46A' : i > 4 && lv === 1 ? '#56687a' : '#F4F1EA'}"/>`;
    $('progress').innerHTML = `<span class="p-lab"><span class="p-full"><b>Level ${lv}</b> · ${P.levels[lv]} · Step ${Math.min(step, of)} of ${of}</span><span class="p-short"><b>Level ${lv}</b> · ${Math.min(step, of)}/${of}</span></span>
      <svg viewBox="0 0 300 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M12 12H288" stroke="#F4F1EA" stroke-opacity=".4" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>
      <path d="M12 12H${x(g.index)}" stroke="#A4E46A" stroke-width="3" stroke-linecap="round"/>${dots}
      <g transform="translate(${x(g.index)} 12)"><rect x="-9" y="-9" width="18" height="12" rx="3" fill="#F4F1EA" stroke="#09162B" stroke-width="1.500"/><rect x="-6" y="-5" width="9" height="4" fill="#E8822C"/><circle cx="-5" cy="5" r="3.200" fill="#09162B"/><circle cx="5" cy="5" r="3.200" fill="#09162B"/></g>
      <text x="${x(4)}" y="24" font-size="8" fill="#c9d2dc" text-anchor="middle">ORION</text></svg>`;
  }

  // ---------- stage ----------
  function setScene(kind, opts) {
    const o = Object.assign({ sun: S.game.scenario.sun.key, calm: quick() }, opts || {});
    if (kind === 'map') { o.lengths = {}; o.slopes = {}; for (const id of Object.keys(P.routes)) { o.lengths[id] = Math.round(D.routes.routes[id].length_3d_m).toLocaleString('en-US'); o.slopes[id] = D.routes.routes[id].max_slope_deg.toFixed(1); } }
    const st = $('stage').getBoundingClientRect(); o.fit = st.height && st.width / st.height < 2.3 ? 'meet' : 'slice';
    const svg = A.scenes[kind](o), sc = $('scene'); sc.innerHTML = svg;
    $('bg').innerHTML = svg.replace(/ id="[^"]*"/g, '').replace(/<g class="mover"[\s\S]*?<\/animateMotion><\/g>/, '');
    if (!o.keep) { sc.classList.remove('swap'); void sc.offsetWidth; sc.classList.add('swap'); }
  }
  function sceneFor(ev, selected) {
    const g = S.game;
    if (ev.type === 'signal_loss') setScene('base'); else if (ev.type === 'route_choice') setScene('map', { selected, leg: ev.leg, keep: !!selected });
    else if (ev.type === 'low_light') setScene('shadow', { booster: selected === 'booster', keep: !!selected }); else if (ev.type === 'particle_alert') setScene('storm', { at: selected, keep: !!selected });
    else setScene('rover', { fixed: g.flags.repaired, awake: true });
  }
  const niceDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  // NASA data tags (at most two per screen): quiet chip → one-sentence popover → drawer.
  function nasaTags(ev) {
    const sc = S.game.scenario;
    return ({
      signal_loss: [{ t: 'NASA map', x: 62, y: 62, s: "NASA's height map shows hills block ORION's signal to our base.", d: 'LRO LOLA height map + our calculation' }],
      route_choice: ev.leg === 'out' ? [{ t: 'NASA map', x: 50, y: 9, s: "A NASA spacecraft measured the Moon with a laser. That's how we know each road's steepness.", d: 'LRO LOLA, 5 m map' },
        { t: 'NASA rover speed', x: 22, y: 84, s: "SCOUT drives as slowly as NASA's VIPER rover: 10 cm each second.", d: 'NASA VIPER documents' }]
        : [{ t: 'NASA map', x: 50, y: 9, s: 'Home is about 16 m higher, so the trip back is uphill.', d: 'LRO LOLA height map' }],
      low_light: [{ t: 'NASA map + camera', x: 50, y: 62, s: "NASA's camera watched this place for a year. Sunlight here only about 1 hour in 3.", d: 'LROC WAC + our shadow calculation' },
        { t: 'NASA map', card: 'booster', s: 'The height map shows where hills block the radio signal.', d: 'LRO LOLA + our calculation' }],
      particle_alert: [{ t: 'Real storm', x: 50, y: 9, s: `This solar storm really happened on ${niceDate(sc.sep.day)}, 2024.`, d: 'NASA CCMC DONKI' },
        { t: 'NASA research', card: 'crater', s: 'NASA scientists found crater walls block about 40% of the particles.', d: 'Phipps et al., NASA GSFC' }],
    })[ev.type] || [];
  }
  const tagHtml = (t, i, cls) => `<button class="ntag ${cls || ''} ${t.y > 70 ? 'low' : ''}" data-tag="${i}" ${t.x != null ? `style="left:${t.x}%;top:${t.y}%"` : ''}><i>${ICON.sat}${esc(t.t)}</i></button>`;
  function bindTags() {
    document.querySelectorAll('.ntag').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); sfx('tap'); const t = S.tags[+b.dataset.tag], pop = $('pop');
      pop.innerHTML = `<p>${esc(t.s)}</p><small>${esc(t.d)}</small><button id="see-how">See how</button>`;
      const sr = $('screen').getBoundingClientRect(), k = sr.width / $('screen').offsetWidth, r = b.getBoundingClientRect();
      pop.classList.add('on'); const w = pop.offsetWidth, h = pop.offsetHeight;
      let x = ((r.left + r.width / 2 - sr.left) / k) - w / 2, y = (r.bottom - sr.top) / k + 6; if (y + h > $('screen').offsetHeight - 8) y = (r.top - sr.top) / k - h - 6;
      pop.style.left = Math.max(8, Math.min($('screen').offsetWidth - w - 8, x)) + 'px'; pop.style.top = Math.max(8, y) + 'px';
      $('see-how').onclick = () => { pop.classList.remove('on'); sheetKnow(); }; }; });
  }

  // ---------- option cards ----------
  // Tags are generated from the numbers: best and worst resource against the other options.
  const GAIN = { time: 'Fastest', battery: 'Saves battery', health: 'Safest for SCOUT' }, COST = { time: 'Takes longest', battery: 'Uses most battery', health: 'Risky for SCOUT' };
  const SPECIAL = { booster: 'Helps later', checkup: 'Shows the real cost', copy: 'Saves the discovery', fix: 'Rescues ORION', link: 'Rescues ORION' };
  function tagsFor(c, all) {
    const known = all.filter((x) => !x.locked && Game.shown(x)), s = Game.shown(c); let gain = SPECIAL[c.id] || null, costT = null;
    if (!s) return { gain, cost: 'Cost not sure' };
    if (known.length > 1) {
      let best = null, worst = null;
      for (const k of RES) { const others = known.filter((x) => x !== c).map((x) => Game.shown(x)[k]), sc = P.resources[k].start - P.resources[k].reserve;
        const adv = (Math.min(...others) - s[k]) / sc, dis = (s[k] - Math.max(...others)) / sc;
        if (adv > 0.004 && (!best || adv > best.v)) best = { k, v: adv }; if (dis > 0.004 && (!worst || dis > worst.v)) worst = { k, v: dis }; }
      if (!gain && best) gain = GAIN[best.k]; if (worst) costT = COST[worst.k];
      if (!gain && !worst) gain = 'In the middle';
    }
    return { gain, cost: costT };
  }
  function valueText(k, v) { if (Math.abs(v) < 0.05) return 'none'; return k === 'time' ? `${fmt(k, v)} h` : `${v > 0 ? '−' : '+'}${fmt(k, v)}%`; }
  function rowsHtml(c, all) {
    const s = Game.shown(c), known = all.filter((x) => !x.locked && Game.shown(x)).map((x) => Game.shown(x));
    const norm = (k, v) => Math.max(0, v) / (P.resources[k].start - P.resources[k].reserve);
    let max = 0.01; for (const x of known) for (const k of RES) max = Math.max(max, norm(k, x[k])); if (!s && c.range) for (const k of ['time', 'battery']) max = Math.max(max, norm(k, c.range[k][1]));
    return `<div class="rows">${RES.map((k) => {
      if (!s) { const rg = c.range && c.range[k]; return `<div class="row t-${k}">${ICON[k]}<span class="lab">${NAME[k]}</span><span class="cbar">${rg ? `<i class="rng" style="left:${(100 * norm(k, rg[0]) / max).toFixed(0)}%;width:${(100 * (norm(k, rg[1]) - norm(k, rg[0])) / max).toFixed(0)}%"></i>` : ''}</span><b>${rg ? (k === 'time' ? `${rg[0]}–${rg[1]} h` : `−${rg[0]}–${rg[1]}%`) : 'not sure'}</b></div>`; }
      const least = known.length > 1 && known.every((x) => x[k] >= s[k] - 1e-9) && known.some((x) => x[k] > s[k] + 0.05);
      return `<div class="row t-${k}">${ICON[k]}<span class="lab">${NAME[k]}</span><span class="cbar"><i style="width:${(100 * norm(k, s[k]) / max).toFixed(0)}%"></i></span><b>${valueText(k, s[k])}${least ? ' <span class="least">least</span>' : ''}</b></div>`; }).join('')}</div>`;
  }
  function cardHtml(c, i, all, ev) {
    const g = S.game, st = A.ROUTE_STYLE[c.id], s = Game.shown(c);
    if (c.locked) return `<div class="opt locked" role="button" tabindex="0" data-id="${c.id}" data-locked="1" style="animation-delay:${i * 40}ms"><div class="opt-head"><span class="opt-ic">${ICON.lock}</span><span class="opt-label">${esc(c.label)}</span></div><span class="note">${esc(c.lockedLabel)}</span></div>`;
    const tg = all.length > 1 ? tagsFor(c, all) : {}, breach = g.wouldBreach(c), ct = S.tags.findIndex((t) => t.card === c.id);
    const sig = !g.arrived && s ? `<div class="sigrow">${ICON.signal}ORION's signal ${g.signal.toFixed(1)} → ${Math.max(0, g.signal - s.time).toFixed(1)} h</div>` : '';
    return `<div class="opt" role="button" tabindex="0" data-id="${c.id}" style="animation-delay:${i * 40}ms">
      <div class="opt-head"><span class="opt-ic">${ICON[c.icon] || ICON.route}</span><span class="opt-label">${st ? st.letter + ' · ' : ''}${esc(c.label)}</span></div>
      <div class="tags">${ev.demo ? `<span class="tg gain">${ICON.check}Ana's pick</span>` : ''}${tg.gain ? `<span class="tg gain">${ICON.up}${tg.gain}</span>` : ''}${tg.cost ? `<span class="tg cost">${ICON.down}${tg.cost}</span>` : ''}${ct >= 0 ? tagHtml(S.tags[ct], ct, 'incard') : ''}</div>
      ${rowsHtml(c, all)}
      ${c.chance != null ? `<span class="note">Success chance: ${c.known ? Math.round(c.chance * 100) + '%' : 'not sure (no check-up)'}. A failed fix costs Health.</span>` : c.note ? `<span class="note">Battery ${esc(c.note)}</span>` : ''}
      ${breach.length ? `<span class="warnchip">${ICON.warn}Uses the ${breach.map((k) => NAME[k]).join(' and ')} reserve</span>` : ''}${sig}</div>`;
  }
  function goLabel() { const g = S.game, c = S.choices.find((x) => x.id === S.sel); if (!c) return 'Choose an option'; const s = Game.shown(c);
    return g.arrived ? 'Go' : `Go · ORION's signal ${s ? Math.max(0, g.signal - s.time).toFixed(1) + ' h left' : 'not sure'}`; }

  function showEvent() {
    const g = S.game, ev = g.event, n = g.index + 1; S.sel = null; S.busy = false; S.choices = g.choices(); S.tags = nasaTags(ev);
    progress(); updateHud(); ghost(null); sceneFor(ev); $('pop').classList.remove('on');
    $('stage-title').innerHTML = `<small>Step ${n} of ${P.events.length}</small>${esc(ev.title)}`;
    $('tags').innerHTML = S.tags.map((t, i) => (t.x != null ? tagHtml(t, i) : '')).join(''); $('lapse').textContent = ''; $('stamp').className = '';
    $('log').textContent = ev.level === 2 && !g.flags.repaired ? 'ORION LOG: battery 18%... ice data safe... waiting.' : '';
    $('dec').innerHTML = `<p class="ask">${esc(ev.ask)}</p><div class="cards">${S.choices.map((c, i) => cardHtml(c, i, S.choices, ev)).join('')}</div><button id="go" disabled>Choose an option</button>`;
    document.querySelectorAll('.opt').forEach((el) => {
      el.onclick = (e) => { if (S.busy || e.target.closest('.ntag')) return; if (el.dataset.locked) { sfx('warning'); say('e6_locked'); return; } select(el.dataset.id); };
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } };
    });
    $('go').onclick = () => { if (S.sel && !S.busy) confirm(S.sel); }; bindTags();
    setMusic(ev.type === 'particle_alert' ? 'storm' : ev.id === 'journey_home' ? 'return' : 'mission');
    const allBreach = S.choices.filter((c) => !c.locked).every((c) => Game.shown(c) && g.wouldBreach(c).length);
    const tight = g.arrived && RES.some((k) => g.resources[k] - g.homeNeed()[k] < P.resources[k].reserve);
    if (ev.type === 'particle_alert') stormPopup();
    else if (allBreach) say('warn_all');
    else if (ev.demo) { say(['e1_ctx', 'e1_why'], { look: 'right' }); select('locate', true); }
    else if (ev.id === 'choose_road') { if (!S.nasaSaid) { S.nasaSaid = true; say(['e2_ctx', 'nasa_first'], { look: 'right' }); const t = document.querySelector('#tags .ntag'); if (t) t.classList.add('pulse'); } else say('e2_ctx', { look: 'right' }); }
    else if (ev.type === 'low_light') say(['e3_ctx', 'e3_booster'], { look: 'right' });
    else if (ev.type === 'rescue') { if (g.flags.booster) { sfx('unlock'); say('e6_unlocked', { big: true }); } else say(g.flags.diagnosed ? 'e6_ctx_known' : 'e6_ctx_blind', { look: 'right' }); }
    else if (ev.id === 'journey_home') say(g.flags.repaired ? ['e7_ctx', 'e7_convoy'] : tight ? 'warn_home' : 'e7_ctx');
    else say('e' + n + '_ctx', { look: 'right' });
  }
  function stormPopup() {
    const sc = S.game.scenario;
    $('stage').classList.add('storm'); if (!quick()) { $('stage').classList.add('shake'); setTimeout(() => $('stage').classList.remove('shake'), 500); }
    sfx('storm'); say('e4_ctx');
    overlay(`<div class="bigwarn">${ICON.warn}</div><h2>Solar storm incoming!</h2><p>Tiny, fast particles from the Sun. Protect SCOUT!</p>
      <p class="fine">${ICON.sat ? '' : ''}Real NASA record: this storm happened on ${niceDate(sc.sep.day)}, 2024. The crew is safe in the base shelter.</p>
      <div class="btnrow"><button class="primary auto" id="shelter">Find shelter</button></div>`, 'warnpop', true);
    $('shelter').onclick = () => { sfx('tap'); closeOverlay(); say('e4_safe'); };
  }
  function select(id, quiet) {
    const g = S.game, c = S.choices.find((x) => x.id === id); S.sel = id; if (!quiet) sfx('select');
    document.querySelectorAll('.opt').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
    ghost(c); $('go').disabled = false; $('go').textContent = g.event.demo ? "OK, do it · ORION's signal " + Math.max(0, g.signal - c.cost.time).toFixed(1) + ' h left' : goLabel();
    if (['route_choice', 'low_light', 'particle_alert'].includes(g.event.type)) sceneFor(g.event, id);
    if (!quiet && g.wouldBreach(c).length) { sfx('warning'); say('warn_reserve'); }
  }
  function costRows(c) { return `<div class="rows">${RES.map((k) => `<div class="row t-${k}">${ICON[k]}<span class="lab">${NAME[k]}</span><b>${valueText(k, c[k])}</b></div>`).join('')}</div>`; }

  async function confirm(id) {
    const g = S.game, ev = g.event; S.busy = true; $('pop').classList.remove('on');
    sfx('go'); ghost(null); hush(); $('go').disabled = true;
    document.querySelectorAll('.opt').forEach((el) => el.classList.add(el.dataset.id === id ? 'chosen' : 'faded'));
    const sig0 = g.signal, was = g.arrived, res = g.choose(id); if (!res.ok) { S.busy = false; return; }
    const c = res.choice, h = g.history.find((x) => x.event === ev.id);
    if (ev.type === 'route_choice') { const d = $('scene').querySelector('animateMotion'); if (d && d.beginElement) { try { d.beginElement(); } catch (e) { /* SMIL optional */ } }
      const lapse = Math.round(c.leg.driveH * 3600 / 2); $('lapse').textContent = `Time-lapse ×${lapse.toLocaleString('en-US')}: a ${c.leg.driveH.toFixed(1)} h drive shown in 2 seconds`; }
    if (id === 'fix') await repairPopup(c);
    if (ev.type === 'rescue' && g.flags.repaired) { setScene('rover', { fixed: true, keep: true, hop: true }); $('log').textContent = 'ORION LOG: I can hear you, Ana. Climbing out into the sunlight.'; }
    else if (ev.type === 'rescue') $('log').textContent = 'ORION LOG: data copied... waiting for you.';
    $('stage').classList.remove('storm');
    await wait(250); updateHud(h.after, true); progress(); award(ev, c);
    let sigLow = false; if (!was) { await wait(700); sigLow = await signalCountdown(sig0, g.signal); }
    if (res.breached.length && !res.arrival) { sfx('lose'); say('breach'); } else if (sigLow) say([c.line, 'sig_low']); else { say(c.line, { big: LINES[c.line].mood === 'celebrate' }); if (LINES[c.line].mood === 'celebrate') sfx(id === 'booster' ? 'unlock' : 'win'); }
    await wait(300);
    const extra = c.range ? `<p class="note">Real cost: ${c.cost.time} h and ${fmt('battery', c.cost.battery)}% Battery. We were not sure because we skipped the check-up.</p>` : '';
    $('dec').innerHTML = `<div class="result">${costRows(c.cost)}${extra}<button class="primary" id="next">${g.status === 'running' || res.arrival ? 'Continue' : 'See the mission report'}</button></div>`;
    S.busy = false;
    $('next').onclick = () => { sfx('tap'); if (ev.type === 'particle_alert') setMusic('mission');
      const after = () => { if (res.arrival) arrival(res); else if (g.status === 'running') showEvent(); else ending(); };
      if (ev.check && g.status === 'running') quickCheck(ev.check, c, after); else after(); };
  }
  // Repair pop-up: a wrench works around a progress ring while bolts click, then the result.
  async function repairPopup(c) {
    overlay(`<p class="kicker">SCOUT's arm at work</p><svg class="ring" viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="45"/><circle class="pr" id="ring-p" cx="50" cy="50" r="45"/></svg><div class="spin">${ICON.wrench}</div><h2 id="rp-t">Fixing ORION's antenna…</h2><p class="fine">Tap to skip</p>`, 'warnpop', true);
    let skip = false; $('overlay').onclick = () => { skip = true; };
    await new Promise((r) => requestAnimationFrame(r)); const ring = $('ring-p'); if (ring) ring.style.strokeDashoffset = '0';
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => sfx('ratchet', i));
    const t0 = performance.now(); while (!skip && performance.now() - t0 < (quick() ? 100 : 2000)) await new Promise((r) => setTimeout(r, 60));
    $('rp-t').textContent = c.success ? 'ORION can hear us!' : 'The fix did not hold'; sfx(c.success ? 'win' : 'lose'); if (c.success && !quick()) sparkles(40);
    await wait(900); $('overlay').onclick = null; closeOverlay();
  }

  // ---------- arrival: the emotional peak ----------
  async function arrival(res) {
    const g = S.game, on = res.arrival.signalOn;
    setScene('rover', { zoom: true, awake: on, hop: on }); $('tags').innerHTML = ''; $('dec').innerHTML = ''; $('lapse').textContent = '';
    $('stage-title').innerHTML = '<small>Level 1</small>Reach ORION'; progress();
    if (on) { sfx('found'); say('arr_on', { big: true }); $('stamp').textContent = 'Found ORION!'; $('stamp').className = 'on'; $('log').textContent = 'ORION LOG: Signal received. Hello, SCOUT!'; if (g.signalAtArrival / P.signal.start > P.signal.low_fraction) giveBadge('friend'); if (!quick()) sparkles(30); }
    else { sfx('lose'); say(['arr_off', 'arr_found']); $('log').textContent = 'ORION LOG: ...'; await wait(500); updateHud(null, true); }
    updateSignal(); await wait(2200);
    if (g.status !== 'running') { say('breach'); await wait(900); return ending(); }
    banner(`<p class="kicker">Level 1 complete</p><h2>${on ? 'ORION can see SCOUT!' : 'Found ORION after a search'}</h2><p>${on ? `We arrived with ${g.signal.toFixed(1)} h of signal left. ORION LOG: “Signal received. Hello, SCOUT!”` : `ORION's signal ran out. The search cost ${P.signal.search_h.toFixed(1)} h more.`}</p>
      <div class="btnrow" style="justify-content:flex-start"><button class="primary" id="lv2">Continue: ${P.levels[2]}</button></div>`, on ? 'win' : 'lose');
    $('lv2').onclick = () => { sfx('tap'); closeBanner(); showEvent(); say(['level2', 'e5_ctx'], { look: 'right' }); };
  }

  // ---------- quick checks and quiz ----------
  function banner(html, cls) { const b = $('banner'); b.className = cls || ''; b.innerHTML = html; b.classList.add('on'); $('dim').className = 'on'; }
  function closeBanner() { $('banner').classList.remove('on'); $('dim').className = ''; }
  function verdict(ok, headline, why, done, label, mine, rightAns) {
    S.asked += 1; if (ok) { S.right += 1; S.streak += 1; sfx('win'); } else { S.streak = 0; sfx('lose'); }
    setAna(ok ? 'celebrate' : 'curious', null, ok); $('caption').textContent = LINES[ok ? 'check_right' : 'check_notyet'].text; speak([ok ? 'check_right' : 'check_notyet']);
    if (ok && !quick()) sparkles(18);
    const b = $('banner'); b.classList.remove('win', 'lose'); b.classList.add(ok ? 'win' : 'lose');
    b.querySelector('.verdict').innerHTML = `<h2>${esc(headline)}</h2>${!ok && mine ? `<p>You said: “${esc(mine)}”. The answer: “${esc(rightAns)}”.</p>` : ''}<p>${esc(why)}</p><div class="btnrow" style="justify-content:flex-start"><button class="primary" id="b-next">${ok ? (label || 'Continue') : 'Got it'}</button></div>`;
    $('b-next').onclick = () => { sfx('tap'); closeBanner(); if (S.streak === 3) { toast('3 in a row!', ICON.check); say('combo', { big: true }); } done(); };
  }
  function quickCheck(kind, c, done) {
    const g = S.game, Q = {
      cold: { line: 'q_cold', q: "Did the cold dark hurt SCOUT's Health?", truth: c.id === 'drive', yes: ['Yes, the cold dark is hard on SCOUT', `SCOUT drove through the shadow and lost ${fmt('health', c.cost.health)}% Health.`], no: ['Right, SCOUT stayed out of the dark', 'We did not drive through the shadow, so SCOUT stayed warm.'] },
      hear: { line: 'q_hear', q: 'Can ORION hear Ana now?', truth: g.flags.repaired, yes: ['Yes, ORION can hear us', g.flags.linked ? 'The booster gives ORION a clear path for the signal. Great plan with the booster!' : 'Its antenna works again, so it can get orders.'], no: ['Right, not yet', 'Its main antenna is still broken. It can only send a weak signal.'] },
    }[kind];
    say(Q.line);
    banner(`<p class="kicker">Quick check</p><div class="verdict"><h2>${Q.q}</h2><div class="answers" style="margin-top:.6em"><button data-a="1">Yes</button><button data-a="0">No</button></div></div>`);
    $('banner').querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { const ok = (b.dataset.a === '1') === Q.truth, t = Q.truth ? Q.yes : Q.no; verdict(ok, ok ? t[0] : 'Not yet', t[1], done, null, b.textContent, Q.truth ? 'Yes' : 'No'); }; });
  }
  const QUIZ = [
    { line: 'quiz_1', q: 'Why is a steep road risky for SCOUT?', a: ['Steep slopes can tip or damage a rover', 'Steep roads are always longer', 'The Sun never shines on hills'], ok: 0, head: 'Yes, steep is risky', why: 'Rovers like VIPER are built for slopes up to about 15 degrees.' },
    { line: 'quiz_2', q: 'Why hide SCOUT in a crater during a solar storm?', a: ['It is warmer in a crater', 'Crater walls block many of the particles', 'Craters have better radio'], ok: 1, head: 'Yes, walls block particles', why: 'NASA scientists found crater walls can block about 40% of them.' },
    { line: 'quiz_3', q: 'What does a signal booster do?', a: ['It makes SCOUT drive faster', 'It charges the battery', 'It lets messages hop over a hill'], ok: 2, head: 'Yes, messages hop over', why: 'Radio needs a clear path. A booster on high ground can see both sides.' },
  ];
  function quiz(i, done) {
    if (i >= QUIZ.length) return done(); const q = QUIZ[i]; say(q.line);
    banner(`<p class="kicker">Quiz · ${i + 1} of ${QUIZ.length}</p><div class="verdict"><h2>${q.q}</h2><div class="answers" style="margin-top:.6em">${q.a.map((a, j) => `<button data-j="${j}">${a}</button>`).join('')}</div></div>`);
    $('banner').querySelectorAll('[data-j]').forEach((b) => { b.onclick = () => { const ok = +b.dataset.j === q.ok; verdict(ok, ok ? q.head : 'Not yet', q.why, () => quiz(i + 1, done), i + 1 < QUIZ.length ? 'Next question' : 'Finish', b.textContent, q.a[q.ok]); }; });
  }

  // ---------- badges ----------
  const BADGES = [
    { id: 'friend', name: "Orion's friend", how: 'Reach ORION with a strong signal', icon: 'signal' }, { id: 'sun', name: 'Sun seeker', how: 'Take the sunniest road', icon: 'sun' },
    { id: 'crater', name: 'Storm smart', how: 'Hide SCOUT in the crater', icon: 'crater' }, { id: 'data', name: 'Data saver', how: "Copy ORION's data", icon: 'data' },
    { id: 'master', name: 'Signal master', how: 'Rescue ORION with the booster', icon: 'booster' }, { id: 'safe', name: 'Safe return', how: 'SCOUT home, any ending', icon: 'home' },
    { id: 'specialist', name: 'Mission specialist', how: 'All checks and quiz right', icon: 'medal' },
  ];
  const badgeHtml = (b, earned) => `<div class="badge ${earned ? '' : 'locked'}"><span class="medal">${ICON[b.icon]}</span><b>${b.name}</b><span>${earned ? 'Earned' : esc(b.how)}</span></div>`;
  function giveBadge(id) {
    if (S.runBadges.has(id)) return; S.runBadges.add(id); S.shelf.add(id);
    try { sessionStorage.setItem('sro_shelf', JSON.stringify([...S.shelf])); } catch (e) { /* storage is optional */ }
    const b = BADGES.find((x) => x.id === id); sfx('badge'); toast('Badge: ' + b.name, ICON[b.icon]); $('shelf-count').textContent = S.shelf.size;
  }
  function award(ev, c) { const g = S.game; if (ev.id === 'choose_road' && c.id === 'flattest') giveBadge('sun'); if (c.id === 'crater') giveBadge('crater'); if (g.flags.data) giveBadge('data'); if (g.flags.linked) giveBadge('master'); }
  function toast(text, icon) { const t = $('toast'); t.innerHTML = (icon || '') + esc(text); t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }

  // ---------- overlays ----------
  function overlay(html, cls, clear) { const o = $('overlay'); o.innerHTML = `<div class="sheetcard ${cls || ''}">${html}</div>`; o.className = 'on' + (clear ? ' clear' : ''); }
  function closeOverlay() { $('overlay').className = ''; $('overlay').innerHTML = ''; }
  const TEAM = 'Saving Rover Orion: Nicole Taylor Marchena (Industrial Design Engineering), Kevin Castro Pérez (Computer Engineering), Isai Irías Salazar (Industrial Design Engineering). Instituto Tecnológico de Costa Rica (TEC).';

  function intro() {
    const force = {}; if (qs.get('sun')) force.sun = qs.get('sun'); if (qs.get('fix')) force.fix = qs.get('fix'); if (qs.get('roll')) force.roll = parseFloat(qs.get('roll'));
    if (!force.sun && !qs.get('seed') && S.firstPlay) force.sun = '1.5deg'; // first play: the brightest day
    S.game = new Game(P, D, S.seed, force);
    Object.assign(S, { asked: 0, right: 0, streak: 0, runBadges: new Set(), quizDone: false, sel: null, busy: false, sigLowSaid: false, tags: [] });
    buildHud(); updateHud(); updateSignal(); progress(); setScene('base'); $('stage').classList.remove('storm');
    $('shelf-count').textContent = S.shelf.size; $('dec').innerHTML = ''; $('tags').innerHTML = ''; $('log').textContent = ''; $('lapse').textContent = ''; $('stage-title').innerHTML = '<small>Level 1</small>' + P.levels[1];
    closeBanner(); closeSheet(); $('caption').textContent = "I'm Ana. Let's save ORION together."; setAna('calm');
    const sc = S.game.scenario, day = sc.sun.key === '0.5deg' ? 'A hard day: Battery will be tight.' : sc.sun.key === '1.0deg' ? 'A medium day.' : 'A bright day, good for learning.';
    overlay(`<button class="skip" id="skip">Skip</button><div class="start-head"><div style="display:grid;justify-items:center;gap:4px"><img src="assets/brand/logo.png" alt="Saving Rover Orion logo"><span class="ai">AI-generated</span></div><div><h2>${P.title}</h2><p>${P.subtitle}</p></div></div>
      <div class="panels">${[1, 2, 3].map((n) => `<div class="panel" id="pn-${n}">${A.panel(n)}<p>${esc(LINES['story_' + n].text)}</p></div>`).join('')}</div>
      <div class="btnrow" id="start-row" style="visibility:hidden"><button class="primary auto" id="go-start">Start mission</button></div>
      <p class="fine">Today on the Moon: ${esc(sc.sun.text)} ${day} · Day code ${S.seed}</p>`);
    let shown = false, timers = [];
    const showAll = () => { if (shown) return; shown = true; timers.forEach(clearTimeout); [1, 2, 3].forEach((n) => $('pn-' + n).classList.add('on')); $('start-row').style.visibility = 'visible'; };
    const run = () => { [1, 2, 3].forEach((n, i) => timers.push(setTimeout(() => $('pn-' + n).classList.add('on'), 100 + i * 300))); timers.push(setTimeout(showAll, quick() ? 400 : 1600)); };
    run();
    $('overlay').onclick = (e) => { if (e.target.closest('#go-start')) return; if (!S.unlocked) { S.unlocked = true; setMusic('menu'); if (!shown) say(['story_1', 'story_2', 'story_3']); } showAll(); };
    $('go-start').onclick = () => { S.unlocked = true; sfx('go'); $('overlay').onclick = null; closeOverlay(); setMusic('mission'); showEvent(); };
  }

  function ending() {
    const g = S.game, o = g.outcome(), e = P.endings[o], d = g.debrief(), tier = o === 'accomplished' ? 2 : o === 'science' ? 1 : 0;
    giveBadge('safe'); if (g.flags.data) giveBadge('data');
    progress(); updateHud(); updateSignal(); ghost(null); $('dec').innerHTML = ''; $('tags').innerHTML = ''; $('lapse').textContent = ''; setMusic('return');
    setScene(g.arrived ? 'rover' : 'base', { fixed: g.flags.repaired, awake: true, hop: tier === 2, sad: tier === 0 }); $('stage-title').innerHTML = '<small>Mission report</small>' + esc(e.title);
    $('log').textContent = g.arrived ? (tier === 2 ? 'ORION LOG: rolling home beside SCOUT.' : 'ORION LOG: ice data safe... waiting for you.') : '';
    if (!S.quizDone) { if (tier === 2) { sfx('win'); sparkles(120); say('end_accomplished', { big: true }); } else if (tier === 1) { sfx('win'); sparkles(40); say('end_science', { big: true }); } else { sfx('lose'); say('end_safe'); } }
    if (S.quizDone && S.asked === 5 && S.right === 5) giveBadge('specialist');
    const worstK = g.breached ? g.breached[0] : null;
    const lesson = worstK ? `SCOUT's ${NAME[worstK]} reached its reserve. The choice that cost the most ${NAME[worstK]}: “${esc(d[worstK].worst.label)}” in “${esc(d[worstK].worst.title)}”. Next time, try a gentler option there.` : '';
    overlay(`<p class="kicker">Mission report</p><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p>${lesson ? `<p>${lesson}</p>` : ''}
      <div class="stats"><div><b>${fmt('time', d.time.spent)} h</b>Time used</div><div><b>${fmt('battery', Math.max(0, d.battery.left))}%</b>Battery left</div><div><b>${fmt('health', Math.max(0, d.health.left))}%</b>Health left</div></div>
      <div class="badges">${BADGES.map((b) => badgeHtml(b, S.runBadges.has(b.id))).join('')}</div>
      <p class="kicker" style="margin-bottom:0">Real NASA data you used today</p>
      <div class="used"><div>${ICON.map}<span>A laser height map of the Moon chose your roads.</span></div><div>${ICON.sun}<span>A year of camera photos showed where sunlight falls.</span></div><div>${ICON.storm}<span>A real solar storm from ${niceDate(g.scenario.sep.day)}, 2024.</span></div></div>
      <div class="btnrow">${S.quizDone ? `<button class="primary auto" id="retry">Try again (same day)</button><button class="secondary" id="again">New day</button>` : `<button class="primary auto" id="quiz">Quick quiz: 3 questions</button><button class="secondary" id="retry">Try again (same day)</button><button class="secondary" id="again">New day</button>`}</div>
      <p class="fine">${S.quizDone ? `Checks and quiz: ${S.right} of ${S.asked} right. ` : ''}Data: NASA LRO/LOLA, LROC; NASA CCMC DONKI; NASA VIPER documents.<br>${TEAM}</p>`, tier === 0 ? 'warnpop wide' : '');
    S.firstPlay = false; try { localStorage.setItem('sro_played', '1'); } catch (err) { /* storage is optional */ }
    if ($('quiz')) $('quiz').onclick = () => { sfx('tap'); closeOverlay(); quiz(0, () => { S.quizDone = true; ending(); }); };
    $('again').onclick = () => { sfx('tap'); hush(); S.seed = newSeed(); intro(); }; $('retry').onclick = () => { sfx('tap'); hush(); intro(); };
  }

  // ---------- data drawer ----------
  function openSheet(html) { $('sheet-body').innerHTML = html; $('sheet').classList.add('on'); $('dim').className = 'on'; $('sheet').style.transform = ''; $('pop').classList.remove('on'); }
  function closeSheet() { $('sheet').classList.remove('on'); $('sheet').style.transform = ''; if (!$('banner').classList.contains('on')) $('dim').className = ''; }
  const chip = (t) => `<span class="chip">${ICON[TAGICON[t]]}${TAG[t]}</span>`;
  const src = (t, name, when, line) => `<div class="src">${chip(t)}<h3>${name}</h3><div class="when">${when}</div><p>${line}</p></div>`;
  function knowCards(ev) {
    const g = S.game, sc = g.scenario, t = D.lola.topography, R = D.routes.routes, SG = D.signal.routes; let h = '';
    const story = src('story', 'Why ORION matters', 'Our story, built on real science', 'ORION found ice. Ice could give future astronauts water, air and rocket fuel (NASA: <a href="https://science.nasa.gov/moon/moon-water-and-ices/" target="_blank" rel="noopener">Moon Water and Ices</a>). Its main antenna broke, so it cannot receive orders; a small send-only antenna still sends a weak beacon. A satellite orbiting the Moon relays that beacon to Mission Control on Earth, which passes it to Base Alpha. Radio between Earth and Moon takes a little over 1 second each way. ORION, SCOUT, the satellite and Base Alpha are story.') +
      src('game', 'Words we use', 'Player word = technical word', "Time = mission time. Battery = SCOUT power (1% = 0.1 kWh). Health = SCOUT condition. ORION's signal = emergency beacon. Signal booster = radio relay. Clear path for the signal = line of sight. Solar storm = solar particle storm. Sleep mode = safe mode. The crew is safe inside Base Alpha.");
    if (!ev) return story;
    if (ev.type === 'signal_loss') h += src('nasa', 'LOLA height map, 5 m per pixel', 'NASA LRO · Site01 “Connecting Ridge”', `ORION's spot is ${Math.round(t.projected_line_length_m)} m from Base Alpha in a straight line, and ${(t.base_elevation_m - t.rover_elevation_m).toFixed(0)} m lower.`) +
      src('model', 'No clear path for the signal', 'Our calculation from NASA data (signal_along_routes.json)', "Hills stand between ORION's spot and Base Alpha on every road, so a direct radio link is blocked. A map check, not a real radio test.") +
      src('nasa', 'Sunlight around ORION', 'LROC WAC map, photos Feb 2010 to Feb 2011 · Speyerer & Robinson 2013', `The area is sunlit in about ${Math.round(D.lroc.samples_percent.orion7_last_known_pixel)}% of the photos: about one hour in three. Inside the small crater it is darker still (story).`) + story;
    if (ev.type === 'route_choice') h += src('model', 'Three roads on the slope map', 'Our calculation from NASA LOLA slope data, 5 m grid', `Lengths ${Math.round(R.direct.length_3d_m)} m, ${Math.round(R.balanced.length_3d_m)} m and ${Math.round(R.flattest.length_3d_m).toLocaleString('en-US')} m. Steepest slopes ${R.direct.max_slope_deg.toFixed(1)}°, ${R.balanced.max_slope_deg.toFixed(1)}° and ${R.flattest.max_slope_deg.toFixed(1)}°. Possible roads on a map: nobody has checked them for rocks or soft soil.`) +
      src('nasa', 'SCOUT follows NASA’s VIPER rover', 'NASA NTRS 20250004148, 20230004239, 20240013903', 'Driving speed 10 cm/s (top speed 20 cm/s). With planning stops, real VIPER progress is about 0.8 cm/s. Design limits: 15° slopes, about 20 cm obstacles, about 9 h in shadow, 40 K to 300 K. SCOUT is a story rover.') +
      src('model', 'Sunlight on each road', 'Our calculation from NASA data (hills within 3 km)', 'Ranks the roads against each other: flatter and longer means sunnier, so SCOUT recharges more. Not the true amount of sunlight.') +
      src('game', 'Battery and Health amounts', 'Chosen by the team', 'How much Battery driving uses and how much Health a steep slope costs are game values. The trigger is real: slopes near 15° are at the limit a VIPER-class rover is built for.') +
      (ev.leg === 'home' ? src('nasa', 'Home is uphill', 'LOLA height map', `Base Alpha ${t.base_elevation_m.toFixed(1)} m, ORION's spot ${t.rover_elevation_m.toFixed(1)} m. The game swaps the measured uphill and downhill for the trip back.`) : '');
    if (ev.type === 'low_light') h += src('model', 'Shadow on your road', 'Our calculation from NASA data', `${sc.sun.text} About ${Math.round(E.routeLeg(P, D, sc, g.flags.route_out, { leg: 'out' }).shadowShare * 100)}% of this road is mostly in shadow. At the pole the Sun stays within about 1.5° of the horizon.`) +
      src('nasa', 'Slow shadows, cold dark', 'NASA VIPER documents', 'Shadows move 0.1 to 1.8 cm/s. VIPER can work about 9 h in shadow: that is how long SCOUT can stay in the dark.') +
      src('model', 'Why a signal booster helps', 'Our calculation from NASA data (signal_along_routes.json)', `Without a booster SCOUT has a clear path for the signal on only ${Math.round(SG.flattest.share_of_route_with_line_of_sight * 100)}–${Math.round(SG.balanced.share_of_route_with_line_of_sight * 100)}% of the way, and none at ORION's spot. A booster (radio relay) on high ground can see both sides.`) +
      src('game', 'What the booster gives', 'Chosen by the team', 'Half the Health loss on the way home, +25% success for the antenna fix, and a new rescue option. These sizes are game values.');
    if (ev.type === 'particle_alert') { const f = D.donki.flaresByDay[sc.sep.day];
      h += src('nasa', 'Solar particle event ' + esc(sc.sep.id), 'NASA CCMC DONKI · ' + niceDate(sc.sep.day) + ', 2024', `Instrument or model listed in the record: ${esc(sc.sep.instrument)}.` + (f ? ` That day the Sun also fired ${f.count} flares; the strongest was class ${esc(f.strongest)}.` : '') + ' May 2024 was unusually stormy. DONKI is research data, not an official forecast.') +
        src('nasa', 'Crater walls block particles', 'Phipps et al., NASA GSFC (NTRS 20210021041, 20210021039)', 'Terrain blocks part of the sky. Inside a crater the solar-particle dose can be about 40% lower.') +
        src('nasa', 'Why SCOUT sleeps', 'LASP note on MAVEN; NASA/JPL reports on MRO and Opportunity', 'Solar particles can flip bits in electronics. Spacecraft then go into a protective safe mode ("sleep mode" in the game).') +
        src('game', 'Health and waiting times', 'Chosen by the team', 'How much Health each shelter costs and how long SCOUT waits are game values. This record does not give a radiation dose on the Moon.') +
        src('story', 'Simplified: the picture', 'Artistic picture', 'Particles are invisible; this picture shows where they come from.'); }
    if (ev.type === 'find_rover' || ev.type === 'rescue') h += src('nasa', 'Check before you move', 'NASA VIPER drive-team procedure', "Rover teams assess the rover's state before planning each move. That is what the check-up represents.") +
      src('game', 'The antenna fix', 'Chosen by the team', `Repair costs and success chances are game values: no NASA dataset gives them. Today's fix: ${g.flags.diagnosed ? esc(sc.fix.name) : 'unknown without a check-up (between 1 and 3 h, 10 to 25% Battery)'}. Success chance 50%, +20% with a check-up, +25% with the booster. The dice roll is fixed by the day code.`) +
      src('story', 'How the rescue works', 'Our story', 'Once ORION can hear Ana again, she orders it to climb out into the sunlight, where it recharges.');
    if (!g.arrived) h += src('game', "ORION's signal", 'Chosen by the team', `The beacon battery (${P.signal.start.toFixed(1)} h) and the ${P.signal.search_h.toFixed(1)} h search are game values. It counts mission hours, never real seconds.`);
    return h;
  }
  function sheetKnow() {
    const g = S.game, ev = g.event; hush();
    const math = ev && S.choices.length ? `<details class="math"><summary>Show the math</summary>${S.choices.map((c) => `<h4>${esc(c.label)}</h4><ul>${c.how.map((x) => `<li>[${TAG[x[0]]}] ${esc(x[1])}</li>`).join('')}</ul>`).join('')}</details>` : '';
    openSheet(`<h2>How do we know?</h2>${knowCards(ev)}${math}<p class="fine">All pictures are illustrations based on NASA LOLA terrain, not photos. Sounds are SCOUT's radio and telemetry; space itself is silent.</p>`);
  }
  function sheetSettings() {
    hush();
    const tg = (id, label, sub, on) => `<div class="toggle"><span>${label}<small>${sub}</small></span><button class="switch" role="switch" id="${id}" aria-checked="${on}" aria-label="${label}"></button></div>`;
    openSheet(`<h2>Settings</h2>${tg('t-music', 'Music', 'Starts after your first tap.', S.musicOn)}
      <div class="toggle"><span>Music volume</span><input type="range" id="t-vol" min="0" max="100" value="${Math.round(S.musicVol * 100)}" aria-label="Music volume"></div>
      ${tg('t-voice', "Ana's voice", 'Captions always stay on.', S.voiceOn)}${tg('t-low', 'Low effects', 'No blur, no particles.', S.lowfx)}${tg('t-calm', 'Calm mode', 'No shake, no movement.', S.calm)}
      <p class="fine" id="voice-name">Voice in use: ${esc(Voice.name)}${Object.keys(VOICE).length ? ` · ${Object.keys(VOICE).length} recorded lines` : ''}. On iPad, turn Silent mode off to hear sound.</p>
      <h2 style="margin-top:.8em">Credits</h2><p class="fine">${TEAM}</p>
      <p class="fine">Data: NASA LRO/LOLA (PGDA Site01), LROC WAC (Speyerer &amp; Robinson 2013), NASA CCMC DONKI, NASA VIPER documents, Phipps et al. (NASA GSFC). Music: Pixabay. Sounds: Kenney (CC0). Font: Michroma (OFL). Icons: Phosphor (MIT).</p>
      <p class="fine">AI use: the team logo is AI-generated; code, code-drawn art and text were made with AI assistance and checked by the team. ORION, SCOUT and Base Alpha are fiction. NASA does not endorse this game.</p>`);
    const bind = (id, fn) => { $(id).onclick = () => { const on = $(id).getAttribute('aria-checked') !== 'true'; $(id).setAttribute('aria-checked', on); sfx('tap'); fn(on); }; };
    bind('t-music', (on) => { S.musicOn = on; musicVolume(Music.cur); }); $('t-vol').oninput = (e) => { S.musicVol = e.target.value / 100; musicVolume(Music.cur); };
    bind('t-voice', (on) => { S.voiceOn = on; if (!on) hush(); }); bind('t-low', (on) => { S.lowfx = on; document.body.classList.toggle('lowfx', on); }); bind('t-calm', (on) => { S.calm = on; document.body.classList.toggle('calm', on); });
  }
  function sheetShelf() { hush(); openSheet(`<h2>Badges</h2><div class="badges">${BADGES.map((b) => badgeHtml(b, S.shelf.has(b.id))).join('')}</div><p class="fine">Badges are earned by what you do. They stay here for this session.</p>`); }
  (function drag() { const h = $('sheet-handle'); let y0 = null, dy = 0;
    h.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; h.setPointerCapture(e.pointerId); $('sheet').style.transition = 'none'; });
    h.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); $('sheet').style.transform = `translate(-50%, ${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; $('sheet').style.transition = ''; if (dy > 70 || dy < 4) closeSheet(); else $('sheet').style.transform = ''; };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end); })();

  // ---------- four-point sparkles (the logo's stars) instead of confetti ----------
  function sparkles(n) {
    if (quick()) return; const cv = $('fx'), w = cv.width = cv.offsetWidth, hgt = cv.height = cv.offsetHeight, ctx = cv.getContext('2d'), cols = ['#F4F1EA', '#A4E46A', '#6FA8DC'];
    const ps = Array.from({ length: Math.min(n, 150) }, () => ({ x: w / 2 + (Math.random() - 0.5) * w * 0.5, y: hgt * 0.45, vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 6, s: 5 + Math.random() * 9, c: cols[(Math.random() * 3) | 0] }));
    let f = 0; const step = () => { ctx.clearRect(0, 0, w, hgt); f += 1;
      for (const p of ps) { p.vy += 0.05; p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - f / 130); const s = p.s; ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s); ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill(); }
      if (f < 130) requestAnimationFrame(step); else ctx.clearRect(0, 0, w, hgt); }; requestAnimationFrame(step);
  }

  // ---------- boot ----------
  function frame() { const want = qs.get('frame') === 'ipad' || (qs.get('frame') !== 'off' && window.innerWidth > 1400); document.body.classList.toggle('framed', want);
    $('bezel').style.transform = want ? `translate(-50%, -50%) scale(${Math.min((window.innerWidth - 24) / 1424, (window.innerHeight - 24) / 1080, 1.15)})` : ''; }
  const newSeed = () => 1000 + Math.floor(Math.random() * 9000);
  window.addEventListener('resize', frame); frame();
  $('screen').addEventListener('scroll', () => { $('screen').scrollTop = 0; $('screen').scrollLeft = 0; });
  $('btn-shelf').querySelector('.ic').innerHTML = ICON.medal; $('btn-settings').querySelector('.ic').innerHTML = ICON.settings; $('btn-know').querySelector('.ic').innerHTML = ICON.know; $('btn-ask').querySelector('.ic').innerHTML = ICON.ask;
  const soundIcon = () => { $('btn-sound').querySelector('.ic').innerHTML = S.sound ? ICON.sound : ICON.mute; $('btn-sound').setAttribute('aria-pressed', S.sound); }; soundIcon();
  $('btn-ask').onclick = () => { S.unlocked = true; sfx('pop'); const g = S.game; if (!g || !g.event) return; say('hint_e' + (g.index + 1), { mood: 'curious', look: 'right' });
    $('bubble').classList.add('hint'); $('who').textContent = 'Ana · Hint'; $('dim').className = 'soft'; setTimeout(() => { $('bubble').classList.remove('hint'); $('who').textContent = 'Ana'; if ($('dim').className === 'soft') $('dim').className = ''; }, 3600); };
  $('btn-know').onclick = () => { sfx('tap'); sheetKnow(); }; $('btn-settings').onclick = () => { sfx('tap'); sheetSettings(); }; $('btn-shelf').onclick = () => { sfx('tap'); sheetShelf(); };
  $('btn-sound').onclick = () => { S.sound = !S.sound; soundIcon(); if (!S.sound) hush(); else { S.unlocked = true; sfx('tap'); } musicVolume(Music.cur); };
  $('dim').onclick = () => { if ($('sheet').classList.contains('on')) closeSheet(); };
  $('screen').addEventListener('click', (e) => { if (!e.target.closest('.ntag') && !e.target.closest('#pop')) $('pop').classList.remove('on'); });
  if ((window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || qs.get('fx') === 'low') { S.lowfx = true; S.calm = true; document.body.classList.add('lowfx', 'calm'); }
  S.seed = parseInt(qs.get('seed'), 10) || newSeed();
  window.SRO_UI = { S, Voice, Music, LINES, BADGES };
  intro();
})();
