// All artwork is drawn in code (SVG). Nothing here is a photograph.
// World art follows the realism rules: black sky, low Sun, long hard shadows,
// grey regolith, no Moon in the sky, no atmosphere glow. Only UI gets colour.
(function () {
  'use strict';
  const INK = '#23243a';          // outline colour for line art
  const SKY = '#0c0c11';          // space black (never pure black)
  const LIT = '#a8a8a4', MID = '#84847f', DIM = '#5c5c5a', SHADE = '#17171c';

  // Icons: Phosphor (MIT) from js/icons.js, plus one satellite drawn here (Phosphor has no satellite icon).
  const ICON = Object.assign({}, window.SRO_ICONS, {
    sat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)"/><path d="M4 9l5-5 2.500 2.500-5 5zM13 17.500l5-5L20.500 15l-5 5zM5 19a4 4 0 0 0 4-4"/></svg>',
  });

  // Ana: junior astronaut, about 11-12. Moods: calm, curious, worried, alarm, celebrate.
  function ana(mood, look) {
    const m = mood || 'calm';
    const lx = look === 'right' ? 2.200 : look === 'left' ? -2.200 : 0;
    const brow = {
      calm: ['M70 77q8-4 16-1', 'M114 76q8-3 16 1'], curious: ['M70 78q8-3 16 0', 'M113 71q9-5 17 0'],
      worried: ['M70 74q8 1 16 5', 'M114 79q8-4 16-5'], alarm: ['M70 70q8-5 16-2', 'M114 68q8-3 16 2'],
      celebrate: ['M70 74q8-6 16-2', 'M114 72q8-4 16 2'],
    }[m];
    const mouth = {
      calm: '<path d="M90 121q10 6 20 0" fill="none" stroke="#7a3f33" stroke-width="2.800" stroke-linecap="round"/>',
      curious: '<path d="M92 122q8 3 15-2" fill="none" stroke="#7a3f33" stroke-width="2.800" stroke-linecap="round"/>',
      worried: '<path d="M91 124q9-4 18 0" fill="none" stroke="#7a3f33" stroke-width="2.800" stroke-linecap="round"/>',
      alarm: '<ellipse cx="100" cy="123" rx="6" ry="5" fill="#7a3f33"/>',
      celebrate: '<path d="M87 118q13 14 26 0z" fill="#7a3f33"/><path d="M90 119.500h20" stroke="#f4f1ea" stroke-width="2.500"/>',
    }[m];
    const eyeRy = m === 'alarm' ? 7.500 : m === 'celebrate' ? 5 : 6.300;
    const eye = (cx) => `<g class="eye"><ellipse cx="${cx}" cy="92" rx="7.500" ry="${eyeRy}" fill="#f4f1ea" stroke="${INK}" stroke-width="1.800"/>
      <circle cx="${cx + lx}" cy="${92 + (m === 'worried' ? 0.800 : 0)}" r="3.900" fill="#3b2a22"/><circle cx="${cx + lx + 1.300}" cy="90.600" r="1.200" fill="#f4f1ea"/></g>`;
    return `<svg viewBox="0 0 200 250" role="img" aria-label="Ana, junior astronaut, ${m}">
      <g class="ana-breathe">
      <!-- suit -->
      <path d="M12 250c0-44 16-66 50-74l20-7h36l20 7c34 8 50 30 50 74z" fill="#ebe8e1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12 250c0-30 8-50 24-62l14 62z" fill="#c2c4cd" stroke="${INK}" stroke-width="2.500" stroke-linejoin="round"/>
      <path d="M188 250c0-30-8-50-24-62l-14 62z" fill="#c2c4cd" stroke="${INK}" stroke-width="2.500" stroke-linejoin="round"/>
      <rect x="74" y="200" width="52" height="40" rx="7" fill="#c2c4cd" stroke="${INK}" stroke-width="2.500"/>
      <rect x="81" y="207" width="20" height="10" rx="2" fill="#262a5e"/><circle cx="110" cy="212" r="3.200" fill="#f2c14e"/><circle cx="119" cy="212" r="3.200" fill="#5ccfe6"/>
      <path d="M81 226h38M81 232h24" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      <!-- shoulder patch -->
      <g transform="translate(26 196)"><circle cx="14" cy="14" r="13" fill="#262a5e" stroke="#f4f1ea" stroke-width="2.500"/><path d="M4 20q10-8 20 0v6H4z" fill="#b9b9b4"/><path d="M14 5l1.600 4.400 4.400 1.600-4.400 1.600L14 17l-1.600-4.400L8 11l4.400-1.600z" fill="#f4f1ea"/></g>
      <!-- neck ring -->
      <rect x="86" y="140" width="28" height="26" fill="#d9a886" stroke="${INK}" stroke-width="2.500"/>
      <ellipse cx="100" cy="170" rx="44" ry="13" fill="#9ea1ad" stroke="${INK}" stroke-width="3"/><ellipse cx="100" cy="167" rx="33" ry="8.500" fill="#6d7080" stroke="${INK}" stroke-width="2"/>
      <!-- hair back + bun -->
      <circle cx="141" cy="52" r="15" fill="#3b2a22" stroke="${INK}" stroke-width="2.500"/>
      <path d="M56 98c-8-44 14-70 44-70s52 26 44 70c-2 14-8 22-12 26H68c-4-4-10-12-12-26z" fill="#3b2a22" stroke="${INK}" stroke-width="2.500"/>
      <!-- face -->
      <path d="M63 90c0-28 16-44 37-44s37 16 37 44c0 30-17 52-37 52s-37-22-37-52z" fill="#e2b08c" stroke="${INK}" stroke-width="2.800"/>
      <path d="M63 86c2-26 18-42 40-41 18 1 32 14 34 38-14-2-24-10-30-22-8 14-24 24-44 25z" fill="#3b2a22" stroke="${INK}" stroke-width="2.300" stroke-linejoin="round"/>
      ${eye(79)}${eye(121)}
      <path d="${brow[0]}" fill="none" stroke="#3b2a22" stroke-width="3.200" stroke-linecap="round"/><path d="${brow[1]}" fill="none" stroke="#3b2a22" stroke-width="3.200" stroke-linecap="round"/>
      <path d="M100 98v10q0 3 4 3" fill="none" stroke="#b07a5c" stroke-width="2.300" stroke-linecap="round"/>
      ${mouth}
      <!-- comms headset -->
      <path d="M58 92C54 46 76 24 100 24s46 22 42 68" fill="none" stroke="#4a4d63" stroke-width="7" stroke-linecap="round"/>
      <path d="M58 92C54 46 76 24 100 24s46 22 42 68" fill="none" stroke="#8d90a3" stroke-width="2" stroke-linecap="round"/>
      <rect x="48" y="84" width="17" height="28" rx="7" fill="#4a4d63" stroke="${INK}" stroke-width="2.500"/>
      <rect x="135" y="84" width="17" height="28" rx="7" fill="#4a4d63" stroke="${INK}" stroke-width="2.500"/>
      <path d="M56 110q2 24 26 22" fill="none" stroke="#4a4d63" stroke-width="3.500" stroke-linecap="round"/><rect x="80" y="127" width="11" height="8" rx="3.500" fill="#23243a"/>
      </g>
    </svg>`;
  }

  // ---------- world pieces (greys only, hard shadows to the left: Sun is low on the right) ----------
  // ORION-7 follows NASA VIPER's layout: 4 wheels, camera mast, side solar panels, drill. No face.
  function orion(x, y, s, lightColor) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-150 60l-260 16 250 6z" fill="${SHADE}"/>
      <rect x="-6" y="18" width="12" height="46" fill="#77797f" stroke="${INK}" stroke-width="2.500"/><path d="M-9 58h18l-5 10h-8z" fill="#55565c" stroke="${INK}" stroke-width="2.500"/>
      <circle cx="-46" cy="52" r="15" fill="#3f4046" stroke="${INK}" stroke-width="2.500"/><circle cx="56" cy="52" r="15" fill="#3f4046" stroke="${INK}" stroke-width="2.500"/>
      <path d="M-70 -6h132l12 44H-80z" fill="#dcdad3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-62 2h110l8 30H-68z" fill="#38415c" stroke="${INK}" stroke-width="2.500" stroke-linejoin="round"/>
      <path d="M-34 2l-3 30M-6 2l-1 30M22 2l2 30M-65 17h117" stroke="#6a7592" stroke-width="1.600"/>
      <circle cx="-68" cy="58" r="19" fill="#55565c" stroke="${INK}" stroke-width="3"/><circle cx="-68" cy="58" r="7" fill="#8d8e93" stroke="${INK}" stroke-width="2"/>
      <circle cx="78" cy="58" r="19" fill="#55565c" stroke="${INK}" stroke-width="3"/><circle cx="78" cy="58" r="7" fill="#8d8e93" stroke="${INK}" stroke-width="2"/>
      <rect x="34" y="-78" width="8" height="74" fill="#b9bbc2" stroke="${INK}" stroke-width="2.500"/>
      <rect x="14" y="-98" width="48" height="22" rx="3" fill="#dcdad3" stroke="${INK}" stroke-width="2.800"/>
      <rect x="19" y="-93" width="10" height="5" fill="#f2c14e" stroke="${INK}" stroke-width="1.500"/><rect x="47" y="-93" width="10" height="5" fill="#f2c14e" stroke="${INK}" stroke-width="1.500"/>
      <circle cx="31" cy="-83" r="2.600" fill="#23243a"/><circle cx="38" cy="-83" r="2.600" fill="#23243a"/><circle cx="45" cy="-83" r="2.600" fill="#23243a"/>
      <path d="M-52 -6v-26" stroke="${INK}" stroke-width="3"/><path d="M-64 -32h24l-6-12h-12z" fill="#e39a4f" stroke="${INK}" stroke-width="2.500" stroke-linejoin="round"/>
      <circle class="status-light" cx="-20" cy="-13" r="6" fill="${lightColor || '#e5604c'}" stroke="${INK}" stroke-width="2"/>
    </g>`;
  }
  // SCOUT: our rescue rover, the friendly cartoon character (logo sticker style:
  // thick off-white outline, camera "eyes", orange stripe). Layout follows VIPER:
  // 4 wheels, camera mast, side solar panel, a small arm.
  function scout(x, y, s, mood) {
    const N = '#09162B', W = '#F4F1EA';
    const shapes = (o) => `
      <circle cx="-42" cy="30" r="17" ${o ? '' : `fill="#283F5B"`}/><circle cx="40" cy="30" r="17" ${o ? '' : `fill="#283F5B"`}/>
      <path d="M-68 16l12-38h92l26 20v18z" ${o ? '' : `fill="${W}"`}/>
      <rect x="-6" y="-70" width="12" height="50" ${o ? '' : `fill="${W}"`}/>
      <rect x="-30" y="-98" width="60" height="32" rx="9" ${o ? '' : `fill="${W}"`}/>
      <path d="M62 -2l26-16 12 8" fill="none" stroke-linecap="round"/>`;
    const lid = mood === 'sad' ? '<path d="M-22 -90h18M4 -90h18" stroke="#09162B" stroke-width="5" stroke-linecap="round"/>' : '';
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="scout ${mood === 'hop' ? 'hop' : ''}">
      <path d="M-70 46l-200 12 190 4z" fill="${SHADE}"/>
      <g stroke="${W}" stroke-width="11" fill="${W}" stroke-linejoin="round">${shapes(true)}</g>
      <g stroke="${N}" stroke-width="4" stroke-linejoin="round">${shapes(false)}
        <path d="M-50 -10h70l10 14h-86z" fill="#E8822C"/>
        <rect x="-58" y="-36" width="62" height="12" fill="#6FA8DC"/>
        <circle cx="-42" cy="30" r="6" fill="${W}"/><circle cx="40" cy="30" r="6" fill="${W}"/>
        <circle cx="-13" cy="-82" r="9" fill="${W}"/><circle cx="13" cy="-82" r="9" fill="${W}"/>
        <circle cx="${mood === 'sad' ? -13 : -11}" cy="${mood === 'sad' ? -79 : -82}" r="4" fill="${N}" stroke="none"/><circle cx="${mood === 'sad' ? 13 : 15}" cy="${mood === 'sad' ? -79 : -82}" r="4" fill="${N}" stroke="none"/>
        <circle cx="100" cy="-10" r="5" fill="#E8822C"/>
      </g>${lid}
    </g></g>`;
  }
  // Short text always sits on a chip, never directly on the scene.
  function chip(x, y, text, anchor) {
    const w = text.length * 10.500 + 30, x0 = anchor === 'end' ? -w : anchor === 'start' ? 0 : -w / 2;
    return `<g transform="translate(${x} ${y})"><rect x="${x0}" y="-18" width="${w}" height="36" rx="18" fill="#1C2E4A" stroke="#F4F1EA" stroke-opacity=".35" stroke-width="1.500"/><text x="${x0 + w / 2}" y="6.500" text-anchor="middle" font-size="19" font-weight="700" fill="#F4F1EA" font-family="-apple-system,system-ui,sans-serif">${text}</text></g>`;
  }
  // A small crater seen from the side: dark bowl, lit far wall.
  function bowl(x, y, w) {
    return `<g transform="translate(${x} ${y})"><ellipse rx="${w}" ry="${w * 0.240}" fill="#c4c4bf"/><ellipse cy="${w * 0.050}" rx="${w * 0.880}" ry="${w * 0.180}" fill="${SHADE}"/><path d="M${-w * 0.880} ${w * 0.050}a${w * 0.880} ${w * 0.180} 0 0 1 ${w * 0.700} ${-w * 0.170}l${-w * 0.300} ${w * 0.200}z" fill="#5c5c5a"/></g>`;
  }
  function boulder(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0l-260 20 250 6z" fill="${SHADE}"/><path d="M-60 0l10-70 44-34 50 14 30 50 6 40z" fill="${MID}"/><path d="M-6 -104l50 14 30 50 6 40H20z" fill="#c9cbc8"/><path d="M-60 0l10-70 44-34-10 104z" fill="#35353a"/></g>`;
  }

  function baseHab(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-90 40l-330 22 330 6z" fill="${SHADE}"/>
      <rect x="-90" y="-30" width="170" height="64" rx="30" fill="#e3e1da" stroke="${INK}" stroke-width="3"/>
      <path d="M-50 -30v64M-10 -30v64M30 -30v64" stroke="#b9bbc2" stroke-width="2.500"/>
      <rect x="40" y="-8" width="24" height="42" rx="4" fill="#4a4d63" stroke="${INK}" stroke-width="2.500"/>
      <path d="M-70 34v14M60 34v14" stroke="${INK}" stroke-width="5"/>
      <path d="M-30 -30v-58" stroke="${INK}" stroke-width="3.500"/><path d="M-48 -92a20 20 0 0 1 36 0z" fill="#b9bbc2" stroke="${INK}" stroke-width="2.500"/>
      <rect x="92" y="-22" width="54" height="34" fill="#38415c" stroke="${INK}" stroke-width="2.500" transform="skewX(-12)"/>
    </g>`;
  }
  function shelter(x, y, s, label) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-70 0l-220 14 210 4z" fill="${SHADE}"/>
      <path d="M-70 0a70 52 0 0 1 140 0z" fill="#8d8d88" stroke="${INK}" stroke-width="3"/>
      <path d="M-18 0v-22a18 18 0 0 1 36 0V0z" fill="#23243a" stroke="${INK}" stroke-width="2.500"/>
      <path d="M-52 -18q20-22 48-27" fill="none" stroke="#a8a8a4" stroke-width="3" stroke-linecap="round"/>
      ${label ? `<text x="0" y="26" text-anchor="middle" font-size="17" font-weight="700" fill="#f4f1ea" font-family="-apple-system,system-ui,Inter,sans-serif">${label}</text>` : ''}
    </g>`;
  }
  const rock = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-10 6l-90 8 92 2z" fill="${SHADE}"/><path d="M-12 6l6-16 14-4 10 10 2 10z" fill="${MID}"/><path d="M8 -14l10 10 2 10H6z" fill="#c4c4bf"/><path d="M-12 6l6-16 14-4-2 20z" fill="#3a3a3d"/></g>`;
  // Crater: the wall nearest the Sun (right side) is in shadow, the far wall is lit.
  const crater = (x, y, rx, ry) => `<g><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${DIM}"/><path d="M${x} ${y - ry}a${rx} ${ry} 0 0 1 0 ${ry * 2}a${rx * 0.550} ${ry} 0 0 0 0 ${-ry * 2}z" fill="${SHADE}"/><path d="M${x - rx} ${y}a${rx} ${ry} 0 0 1 ${rx} ${-ry}" fill="none" stroke="#c9c9c4" stroke-width="3"/></g>`;

  // Shared landscape. Sun height follows today's scenario, always close to the horizon.
  function ground(sunKey) {
    const sy = { '0.5deg': 247, '1.0deg': 240, '1.5deg': 233 }[sunKey] || 240;
    return `<rect x="-900" y="-900" width="3000" height="1400" fill="${SKY}"/><rect x="-900" y="440" width="3000" height="1200" fill="${LIT}"/>
      <!-- Earth: small and low, lit from the Sun's side -->
      <g transform="translate(170 196)"><circle r="10" fill="#1a2238"/><path d="M0-10a10 10 0 0 1 0 20a5 10 0 0 0 0-20z" fill="#5d86c6"/><path d="M3-6q4 3 2 8" stroke="#e8e6df" stroke-width="1.800" fill="none"/></g>
      <!-- Sun on the horizon: a hard disc. No glow, because there is no air to scatter light. -->
      <circle cx="1040" cy="${sy}" r="15" fill="#fbf6e6"/>
      <!-- far ridge: faces towards the Sun are lit, faces away are black -->
      <path d="M-900 262H0L120 236 250 250 420 196 560 246 700 222 860 252 1010 244 1200 232H2100V330H-900z" fill="${SHADE}"/>
      <path d="M420 196L560 246 520 262 470 250zM700 222L860 252 800 262 740 250zM120 236L250 250 200 262 150 254z" fill="${LIT}"/>
      <!-- mid ground -->
      <path d="M-900 290H0Q300 262 600 284T1200 268H2100V500H-900z" fill="${MID}"/>
      <path d="M0 300Q200 284 430 300L0 330z" fill="${SHADE}"/>
      <!-- foreground -->
      <path d="M-900 372H0Q320 340 640 366T1200 350H2100V500H-900z" fill="${LIT}"/>
      <path d="M420 196L60 340 300 332z" fill="${SHADE}" opacity=".96"/>`;
  }
  // Wide stages crop the picture (slice); narrow stages show all of it (meet) and
  // the oversized sky and ground rectangles fill the rest.
  function wrap(inner, label, fit) {
    return `<svg viewBox="-120 0 1200 500" preserveAspectRatio="xMidYMid ${fit || 'slice'}" overflow="visible" role="img" aria-label="${label}">${inner}</svg>`;
  }

  const ROUTE_STYLE = {
    direct: { color: '#F4F1EA', dash: '', letter: 'A' },
    balanced: { color: '#aab4ff', dash: '14 10', letter: 'B' },
    flattest: { color: '#e0b4ff', dash: '2 12', letter: 'C' },
  };
  const ROUTE_PATH = {
    direct: 'M200 300 L1000 330',
    balanced: 'M200 300 C420 410 760 420 1000 330',
    flattest: 'M200 300 C380 60 900 70 1000 330',
  };

  const scenes = {
    base(o) {
      return wrap(ground(o.sun) + crater(820, 420, 70, 14) + rock(640, 400, 1.600) + rock(980, 440, 2.200) +
        baseHab(250, 330, 1.050) + scout(560, 384, 0.900) +
        `<path d="M222 236Q330 150 440 204" fill="none" stroke="#F4F1EA" stroke-width="3.500" stroke-dasharray="2 11" stroke-linecap="round"/>
         <g transform="translate(446 206)"><circle r="15" fill="#1C2E4A" stroke="#F4F1EA" stroke-width="3"/><path d="M-6-6l12 12M6-6-6 6" stroke="#E8822C" stroke-width="3.500" stroke-linecap="round"/></g>` +
        chip(250, 420, 'Base Alpha') + chip(560, 446, 'SCOUT') + chip(470, 160, 'Hills block the signal', 'start'),
      'Base Alpha. Hills block the signal to ORION.', o.fit);
    },
    map(o) {
      const sel = o.selected, home = o.leg === 'home';
      let r = '';
      for (const id of Object.keys(ROUTE_PATH)) {
        const st = ROUTE_STYLE[id], on = !sel || sel === id;
        r += `<path id="rp-${id}" d="${ROUTE_PATH[id]}" fill="none" stroke="${st.color}" stroke-width="${sel === id ? 9 : 6}" stroke-dasharray="${st.dash}" stroke-linecap="round" opacity="${on ? 1 : 0.280}"/>`;
      }
      const tags = { direct: [610, 312], balanced: [600, 398], flattest: [640, 126] };
      for (const id of Object.keys(tags)) { const on = !sel || sel === id; r += `<g opacity="${on ? 1 : 0.350}">${chip(tags[id][0], tags[id][1], ROUTE_STYLE[id].letter + ' · ' + o.lengths[id] + ' m · steep ' + o.slopes[id] + '°')}</g>`; }
      const mover = sel ? `<g class="mover" opacity="0"><set attributeName="opacity" to="1" begin="drive.begin" fill="freeze"/><circle r="17" fill="#F4F1EA" stroke="#09162B" stroke-width="4"/><rect x="-8" y="-5" width="16" height="9" rx="2" fill="#E8822C"/>
        <animateMotion id="drive" dur="${o.calm ? '0.01s' : '2s'}" begin="indefinite" fill="freeze" ${home ? 'keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : ''}><mpath href="#rp-${sel}"/></animateMotion></g>` : '';
      return wrap(`<rect x="-900" y="-900" width="3000" height="2300" fill="${MID}"/>
        <path d="M480 290Q560 200 740 236Q800 286 724 338Q570 366 480 290z" fill="${LIT}"/>
        <path d="M480 290Q560 200 648 216Q580 286 548 350Q500 330 480 290z" fill="${SHADE}"/>
        <path d="M480 270L250 286 262 334 530 346z" fill="${SHADE}" opacity=".94"/>
        ${crater(430, 172, 38, 24)}${crater(900, 168, 44, 28)}${crater(140, 420, 30, 18)}${crater(820, 430, 46, 26)}${crater(1090, 420, 34, 20)}
        ${r}
        <g transform="translate(200 300)"><circle r="22" fill="#F4F1EA" stroke="#09162B" stroke-width="4"/><path d="M-10 6a10 10 0 0 1 20 0z" fill="#09162B"/></g>${chip(200, 256, 'Base Alpha')}
        <g transform="translate(1000 330)"><circle r="24" fill="#1C2E4A" stroke="#E8822C" stroke-width="5"/><circle r="7" fill="#E8822C"/></g>${chip(1000, 384, 'ORION')}
        <g transform="translate(1040 120)"><circle r="16" fill="#fbf6e6"/><path d="M-30 0h-50" stroke="#fbf6e6" stroke-width="4" stroke-linecap="round"/><path d="M-80 0l14-9v18z" fill="#fbf6e6"/></g>
        ${mover}`, 'Map sketch from Base Alpha to ORION with three roads', o.fit);
    },
    shadow(o) {
      return wrap(ground(o.sun) + `<path d="M260 500L470 296 860 296 720 500z" fill="${SHADE}" opacity=".97"/>` +
        rock(1080, 380, 1.400) + crater(200, 440, 60, 12) + scout(990, 372, 0.950) +
        (o.booster ? `<g transform="translate(420 196)"><path d="M0 0v-46" stroke="#F4F1EA" stroke-width="5"/><circle cy="-52" r="9" fill="#A4E46A" stroke="#09162B" stroke-width="3"/><path d="M-22-60a26 26 0 0 1 44 0M-34-70a42 42 0 0 1 68 0" fill="none" stroke="#A4E46A" stroke-width="4" stroke-linecap="round"/></g>` + chip(420, 226, 'Signal booster') : chip(420, 180, 'Ridge')) +
        chip(590, 400, 'Cold shadow'), 'A long hard shadow across the road', o.fit);
    },
    storm(o) {
      return wrap(ground(o.sun) + bowl(300, 392, 190) + boulder(820, 400, 1.200) +
        scout(o.at === 'crater' ? 300 : o.at === 'boulder' ? 700 : 560, o.at === 'crater' ? 398 : 396, o.at ? 0.700 : 0.900, null) +
        chip(300, 318, 'Crater · blocks more · farther') + chip(840, 252, 'Boulder · blocks less · close'), 'A crater and a boulder: two places for SCOUT to hide', o.fit);
    },
    rover(o) {
      // ORION: realistic style, dusty, tilted inside a small dark crater. Lights dim until rescued.
      const light = o.fixed ? '#A4E46A' : o.awake ? '#E8822C' : '#5a3a30';
      return wrap(`<g class="${o.zoom ? 'zoom-in' : ''}" style="transform-origin:780px 340px">` + ground(o.sun) + rock(1090, 440, 2) +
        (o.fixed ? '' : bowl(790, 404, 250)) +
        `<g transform="${o.fixed ? '' : 'rotate(-11 780 380)'}" opacity="${o.fixed ? 1 : 0.880}">${orion(780, o.fixed ? 330 : 352, 1.150, light)}</g>` +
        scout(330, 392, 1.050, o.hop ? 'hop' : o.sad ? 'sad' : null) + chip(330, 462, 'SCOUT') + chip(790, 470, o.log || 'ORION') + '</g>', 'ORION, tilted in a small dark crater', o.fit);
    },
  };

  // Three story panels for the start screen.
  function panel(n) {
    const g = `<rect width="400" height="260" fill="${SKY}"/><path d="M0 150L90 132 180 146 260 120 400 140V260H0z" fill="${SHADE}"/><path d="M260 120L330 146 300 152z" fill="${LIT}"/><path d="M0 178Q200 160 400 172V260H0z" fill="${LIT}"/>`;
    const sun = '<circle cx="350" cy="138" r="9" fill="#fbf6e6"/>';
    const star = (x, y, r, c) => `<path d="M${x} ${y - r}l${r * 0.280} ${r * 0.720} ${r * 0.720} ${r * 0.280}-${r * 0.720} ${r * 0.280}-${r * 0.280} ${r * 0.720}-${r * 0.280}-${r * 0.720}-${r * 0.720}-${r * 0.280} ${r * 0.720}-${r * 0.280}z" fill="${c}"/>`;
    if (n === 1) return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" role="img" aria-label="ORION finds ice">${g}${sun}<g class="p-drive">${orion(150, 176, 0.620, '#A4E46A')}</g>
      <g class="p-pop"><path d="M262 214l14-26 16 8 12-20 14 38z" fill="#bfe3ff" stroke="#F4F1EA" stroke-width="3" stroke-linejoin="round"/></g><g class="p-tw t1">${star(300, 150, 16, '#F4F1EA')}</g><g class="p-tw t2">${star(336, 186, 9, '#6FA8DC')}</g><g class="p-tw t3">${star(258, 172, 8, '#F4F1EA')}</g></svg>`;
    if (n === 2) return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" role="img" aria-label="ORION falls into a dark crater">${g}${sun}<ellipse cx="200" cy="214" rx="170" ry="40" fill="#c4c4bf"/><ellipse cx="200" cy="220" rx="150" ry="32" fill="${SHADE}"/>
      <g class="p-fall"><g transform="rotate(-14 200 200)" opacity=".9">${orion(200, 190, 0.620, '#5a3a30')}</g></g><path class="p-flash" d="M236 96l-10 14 12 4-10 16" fill="none" stroke="#E8822C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" role="img" aria-label="A weak beacon calls for help">${g}<ellipse cx="200" cy="214" rx="170" ry="40" fill="#c4c4bf"/><ellipse cx="200" cy="220" rx="150" ry="32" fill="${SHADE}"/>
      <g transform="rotate(-14 200 200)" opacity=".9">${orion(200, 190, 0.620, '#E8822C')}</g>
      <g fill="none" stroke="#F4F1EA" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 10"><path class="p-wave v1" d="M150 96a70 70 0 0 1 100 0"/><path class="p-wave v2" d="M128 72a104 104 0 0 1 144 0"/><path class="p-wave v3" d="M106 48a138 138 0 0 1 188 0"/></g>
      <g transform="translate(318 66)"><rect x="-26" y="-14" width="48" height="28" rx="5" fill="none" stroke="#F4F1EA" stroke-width="4"/><rect x="24" y="-6" width="6" height="12" fill="#F4F1EA"/><rect class="p-batt" x="-21" y="-9" width="9" height="18" fill="#E8822C"/></g></svg>`;
  }

  window.SRO_ART = { ICON, ana, scenes, panel, scout, ROUTE_STYLE };
})();
