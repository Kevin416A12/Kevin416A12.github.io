// Mission engine: world-agnostic decision engine. No DOM code; runs in the
// browser and in Node tests.
//  - costs are DERIVED from measured data (road length, steepness, sunlight)
//  - event TYPES live here; the world (numbers, wording, datasets) lives in a pack
//  - choices are never blocked: reaching a reserve ends the mission safely
//  - a seed picks real-data variants and the one dice roll, so a day can be replayed
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SRO_ENGINE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RES = ['time', 'battery', 'health'];
  const r3 = (x) => Math.round(x * 1000) / 1000;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Picks this day's variants. `force` lets tests pin any of them.
  function buildScenario(pack, data, seed, force) {
    const rand = rng(seed), pick = (arr) => arr[Math.floor(rand() * arr.length)], f = force || {};
    const sun = f.sun ? pack.sunScenarios.find((s) => s.key === f.sun) : pick(pack.sunScenarios);
    const fix = f.fix ? pack.fixes.find((x) => x.id === f.fix) : pick(pack.fixes);
    const sep = f.sep ? data.donki.sepRecords.find((x) => x.id === f.sep) : pick(data.donki.sepRecords);
    const roll = f.roll != null ? f.roll : rand(); // the antenna-fix dice roll, fixed for the day
    return { seed, sun, fix, sep, roll };
  }

  const cost = (hours, battery, health) => ({ time: r3(hours || 0), battery: r3(battery || 0), health: r3(health || 0) });

  // One leg along a measured road.
  //   time    = road length / SCOUT speed + stops
  //   battery = driving (harder when steep) + climbing - sunlight collected (+ heaters in shadow)
  //   health  = grows as the steepest slope approaches the 15 degree limit
  function routeLeg(pack, data, scenario, routeId, opts) {
    const o = opts || {}, R = pack.rules, rt = data.routes.routes[routeId];
    const il = data.illum.routes[routeId].sunlit_fraction_by_sun_elevation[scenario.sun.key];
    const driveH = rt.length_3d_m / R.drive_speed_m_s.value / 3600;
    let hours = driveH + R.stops_h_per_leg.value;
    if (o.known) hours *= R.known_route_time_factor.value;
    if (o.convoy) hours *= R.convoy_time_factor.value;
    const climbM = o.leg === 'home' ? rt.descent_m : rt.ascent_m; // going home swaps uphill and downhill
    const drive = R.drive_kw.value * driveH * (1 + rt.max_slope_deg / R.slope_limit_deg.value);
    const climb = R.climb_kwh_per_m.value * climbM;
    const solar = R.solar_kw.value * driveH * il.mean;
    const shadowHeat = R.heater_kw_in_shadow.value * il.share_of_route_below_50pct * driveH;
    const kwh = drive + climb - solar + (o.includeShadow ? shadowHeat : 0);
    const pct = 100 * kwh / R.battery_kwh.value;
    let health = R.slope_health_at_limit.value * Math.pow(rt.max_slope_deg / R.slope_limit_deg.value, 2);
    if (o.booster) health *= R.booster_health_factor.value;
    return { routeId, hours, driveH, kwh, battery: pct, health, drive, climb, solar, shadowHeat, climbM,
      length_m: rt.length_3d_m, max_slope_deg: rt.max_slope_deg, light: il.mean, shadowShare: il.share_of_route_below_50pct,
      contact: data.signal.routes[routeId].share_of_route_with_line_of_sight, known: !!o.known, convoy: !!o.convoy };
  }

  // ---- Event types. Each returns the choices for the current state. ----
  const TYPES = {
    // Decision 1 is a demonstration: Ana makes the choice and explains it.
    signal_loss(g, ev) {
      const c = ev.choices.locate;
      return [{ id: 'locate', label: c.label, icon: c.icon, cost: cost(c.hours, c.battery, 0), flags: { located: true }, line: 'r_locate',
        how: [['game', `Finding the exact spot: ${c.hours} h, computers ${c.battery}% Battery`]] }];
    },

    route_choice(g, ev) {
      const home = ev.leg === 'home';
      return Object.keys(g.pack.routes).map((id) => {
        const known = home && g.flags.route_out === id;
        const leg = routeLeg(g.pack, g.data, g.scenario, id, { leg: ev.leg, known, includeShadow: home, convoy: home && g.flags.repaired, booster: home && g.flags.booster });
        const how = [
          ['model', `Road we traced on NASA's LOLA map: ${Math.round(leg.length_m)} m, steepest ${leg.max_slope_deg.toFixed(1)}°`],
          ['nasa', `SCOUT speed 10 cm/s (VIPER) → ${leg.driveH.toFixed(1)} h driving`],
          ['game', `+ ${g.pack.rules.stops_h_per_leg.value} h for stops${known ? ', −10% on a road we know' : ''}${leg.convoy ? ', +25% because ORION drives along' : ''}`],
          ['game', `Driving ${leg.drive.toFixed(1)} kWh + climbing ${Math.round(leg.climbM)} m ${leg.climb.toFixed(1)} kWh`],
          ['model', `Sunlight gives back ${leg.solar.toFixed(1)} kWh (sunlight ranking from our terrain model)`],
        ];
        if (home) how.push(['model', `Heaters in shadow ${leg.shadowHeat.toFixed(1)} kWh`]);
        how.push(['game', `= ${leg.kwh.toFixed(1)} kWh = ${Math.round(leg.battery)}% of a ${g.pack.rules.battery_kwh.value} kWh battery`]);
        how.push(['game', `Health: 28% × (steepest ÷ 15°)² = ${leg.health.toFixed(0)}%${home && g.flags.booster ? ' (halved: Ana guides SCOUT through the booster)' : ''}`]);
        return { id, label: g.pack.routes[id].name, icon: 'route', line: home ? 'r_home' : 'r_route_' + id, leg, note: 'recharges in sun',
          cost: cost(leg.hours, leg.battery, leg.health), flags: home ? { route_home: id } : { route_out: id }, how };
      });
    },

    low_light(g, ev) {
      const c = ev.choices, R = g.pack.rules;
      const leg = routeLeg(g.pack, g.data, g.scenario, g.flags.route_out, { leg: 'out' });
      const heat = 100 * leg.shadowHeat / R.battery_kwh.value;
      const pct = Math.round(leg.shadowShare * 100);
      return [
        { id: 'wait', label: c.wait.label, icon: c.wait.icon, cost: cost(c.wait.hours, 0, 0), flags: {}, line: 'r_wait',
          how: [['game', `Waiting ${c.wait.hours} h for the shadow to move`], ['nasa', 'Shadows near the pole move slowly: 0.1 to 1.8 cm/s (VIPER documents)']] },
        { id: 'drive', label: c.drive.label, icon: c.drive.icon, cost: cost(0, c.drive.battery_base + heat, c.drive.health_base + c.drive.health_per_share * leg.shadowShare), flags: { dark: true }, line: 'r_drive_dark',
          how: [['model', `${pct}% of this road is mostly in shadow today`], ['game', `Heaters: ${c.drive.battery_base}% + ${heat.toFixed(0)}% Battery. Cold: ${c.drive.health_base}% + ${(c.drive.health_per_share * leg.shadowShare).toFixed(0)}% Health`],
            ['nasa', 'VIPER can work about 9 h in shadow; SCOUT never stays longer']] },
        { id: 'booster', label: c.booster.label, icon: c.booster.icon, cost: cost(c.booster.hours, c.booster.battery, 0), flags: { booster: true }, line: 'r_booster',
          how: [['model', `Without a booster SCOUT has a clear path for the signal on only ${Math.round(leg.contact * 100)}% of this road, and none at ORION's spot`],
            ['game', `Building it: ${c.booster.hours} h, ${c.booster.battery}% Battery. What it gives later is a game value.`]] },
      ];
    },

    particle_alert(g, ev) {
      return ['crater', 'boulder'].map((id) => { const c = ev.choices[id];
        return { id, label: c.label, icon: c.icon, chip: c.chip, cost: cost(c.hours, c.battery, c.health), flags: { sheltered: id }, line: 'r_shelter_' + id,
          how: [['game', `Trip and sleep mode: ${c.hours} h, ${c.battery}% Battery, ${c.health}% Health`],
            ['nasa', 'Crater walls can cut the particle dose by about 40% (Phipps et al., NASA GSFC)']] }; });
    },

    find_rover(g, ev) {
      const c = ev.choices;
      return [
        { id: 'checkup', label: c.checkup.label, icon: c.checkup.icon, cost: cost(c.checkup.hours, c.checkup.battery, 0), flags: { diagnosed: true }, line: 'r_checkup_' + g.scenario.fix.id,
          how: [['game', `Check-up: ${c.checkup.hours} h, ${c.checkup.battery}% Battery`], ['nasa', 'Rover teams assess the rover before planning each move (VIPER drive-team procedure)']] },
        { id: 'copy', label: c.copy.label, icon: c.copy.icon, cost: cost(c.copy.hours, c.copy.battery, 0), flags: { data: true }, line: 'r_copy',
          how: [['game', `Copying the data: ${c.copy.hours} h, ${c.copy.battery}% Battery`]] },
      ];
    },

    rescue(g, ev) {
      const c = ev.choices, F = g.pack.fix, fx = g.scenario.fix, fixes = g.pack.fixes;
      const known = g.flags.diagnosed;
      const chance = F.base_chance + (known ? F.checkup_bonus : 0) + (g.flags.booster ? F.booster_bonus : 0);
      const success = g.scenario.roll < chance;
      const cp = g.flags.data ? { hours: 0, battery: 0 } : ev.copy;
      // If the fix fails, SCOUT still copies the data so the discovery is never lost.
      const real = success ? cost(fx.hours, fx.battery, F.success_health) : cost(fx.hours + cp.hours, fx.battery + cp.battery, F.fail_health);
      const lo = fixes[0], hi = fixes[fixes.length - 1];
      const fix = { id: 'fix', label: c.fix.label, icon: c.fix.icon, cost: real, chance, success, known,
        preview: known ? cost(fx.hours, fx.battery, 0) : null,
        range: known ? null : { time: [lo.hours, hi.hours], battery: [lo.battery, hi.battery] },
        flags: success ? { repaired: true, data: true, fixed: true } : { data: true, fix_failed: true }, line: success ? 'r_fix_ok' : 'r_fix_fail',
        how: [['game', known ? `Check-up found ${fx.name}: ${fx.hours} h, ${fx.battery}% Battery` : `No check-up: between ${lo.hours} and ${hi.hours} h, ${lo.battery} to ${hi.battery}% Battery`],
          ['game', `Success chance ${Math.round(chance * 100)}% = 50%${known ? ' + 20% check-up' : ''}${g.flags.booster ? ' + 25% booster' : ''}. A failed fix costs ${F.fail_health}% Health.`]] };
      const lv = g.flags.data ? ev.pack_up : ev.copy;
      const leave = { id: 'leave', label: c.leave.label, icon: c.leave.icon, cost: cost(lv.hours, lv.battery, 0), flags: { data: true }, line: 'r_leave',
        how: [['game', g.flags.data ? `Packing up: ${lv.hours} h` : `Copying the data: ${lv.hours} h, ${lv.battery}% Battery`]] };
      const link = { id: 'link', label: c.link.label, icon: c.link.icon, cost: cost(c.link.hours, c.link.battery, 0), locked: !g.flags.booster, lockedLabel: c.link.locked_label,
        flags: { repaired: true, data: true, linked: true }, line: 'r_link',
        how: [['game', `Plugging in the spare antenna: ${c.link.hours} h, ${c.link.battery}% Battery. Works because the booster has a clear path to the base.`]] };
      return [fix, leave, link];
    },
  };

  class Game {
    constructor(pack, data, seed, force) {
      this.pack = pack; this.data = data;
      this.scenario = buildScenario(pack, data, seed == null ? 1 : seed, force);
      this.resources = {}; for (const k of RES) this.resources[k] = pack.resources[k].start;
      this.flags = { located: false, booster: false, dark: false, sheltered: null, diagnosed: false, data: false, repaired: false, fixed: false, linked: false, fix_failed: false, route_out: null, route_home: null };
      this.signal = pack.signal.start; this.arrived = false; this.signalOnAtArrival = null; this.signalAtArrival = null;
      this.index = 0; this.status = 'running'; this.breached = null; this.history = [];
    }
    get event() { return this.status === 'running' ? this.pack.events[this.index] : null; }
    choices() { const ev = this.event; return ev ? TYPES[ev.type](this, ev) : []; }
    // What the player is shown before choosing (the real cost may still be unknown).
    static shown(c) { return c.preview || (c.range ? null : c.cost); }
    wouldBreach(choice) {
      const s = Game.shown(choice); if (!s) return [];
      return RES.filter((k) => this.resources[k] - s[k] < this.pack.resources[k].reserve - 1e-9);
    }
    choose(choiceId) {
      if (this.status !== 'running') return { ok: false, message: 'The mission is over.' };
      const ev = this.event, choice = this.choices().find((c) => c.id === choiceId);
      if (!choice || choice.locked) return { ok: false, message: 'That choice is not available.' };
      const before = { ...this.resources };
      for (const k of RES) this.resources[k] = r3(Math.min(this.pack.resources[k].start, this.resources[k] - choice.cost[k]));
      Object.assign(this.flags, choice.flags);
      this.history.push({ event: ev.id, title: ev.title, choice: choice.id, label: choice.label, cost: choice.cost, before, after: { ...this.resources } });
      let arrival = null;
      if (!this.arrived) {
        this.signal = r3(Math.max(0, this.signal - choice.cost.time));
        if (ev.arrive_after) {
          this.arrived = true; this.signalAtArrival = this.signal; this.signalOnAtArrival = this.signal > 1e-9;
          arrival = { signalOn: this.signalOnAtArrival, search: null };
          if (!this.signalOnAtArrival) {
            // Signal lost: not the end. SCOUT searches the last known spot.
            const sc = cost(this.pack.signal.search_h, 0, 0), b2 = { ...this.resources };
            for (const k of RES) this.resources[k] = r3(this.resources[k] - sc[k]);
            this.history.push({ event: 'search', title: 'Searching for ORION', choice: 'search', label: 'Signal lost', cost: sc, before: b2, after: { ...this.resources } });
            arrival.search = sc;
          }
        }
      }
      const breached = RES.filter((k) => this.resources[k] < this.pack.resources[k].reserve - 1e-9);
      this.index += 1;
      if (breached.length) { this.status = 'aborted'; this.breached = breached; }
      else if (this.index >= this.pack.events.length) this.status = 'completed';
      return { ok: true, choice, breached, arrival };
    }
    // Cheapest way home for each bar: shown as a flag on the bars.
    homeNeed() {
      const need = { time: Infinity, battery: Infinity, health: Infinity };
      for (const id of Object.keys(this.pack.routes)) {
        const leg = routeLeg(this.pack, this.data, this.scenario, id, { leg: 'home', known: this.flags.route_out === id, includeShadow: true, convoy: this.flags.repaired, booster: this.flags.booster });
        const c = cost(leg.hours, leg.battery, leg.health);
        for (const k of RES) need[k] = Math.min(need[k], c[k]);
      }
      return need;
    }
    outcome() {
      if (this.status === 'running') return null;
      if (this.status === 'aborted') return this.flags.data ? 'safe_data' : 'safe';
      return this.flags.repaired ? 'accomplished' : 'science';
    }
    debrief() {
      const out = {};
      for (const k of RES) { let worst = null; for (const h of this.history) if (!worst || h.cost[k] > worst.cost[k]) worst = h;
        out[k] = { spent: r3(this.pack.resources[k].start - this.resources[k]), left: this.resources[k], worst }; }
      return out;
    }
  }
  return { Game, buildScenario, routeLeg, rng, RES, TYPES };
});
