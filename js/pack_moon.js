// ENVIRONMENT PACK: Moon, lunar south pole, "Connecting Ridge".
// The engine (js/engine.js) knows event TYPES. A pack supplies the world:
// constants, wording and which measured datasets feed each event.
// Tags: "nasa" (sourced), "model" (our calculation from NASA data), "game" (game value).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SRO_PACK_MOON = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    id: 'moon',
    title: 'Junior Astronaut Mission Trainer', subtitle: 'Saving Rover Orion',
    place: 'Connecting Ridge, lunar south pole',

    // Player words: Time, Battery, Health. Technical words appear only in the data drawer.
    resources: {
      time: { label: 'Time', tech: 'Mission time', unit: 'h', start: 17, reserve: 1.5, tag: 'game', decimals: 1 },
      battery: { label: 'Battery', tech: 'SCOUT power', unit: '%', start: 100, reserve: 15, tag: 'game', decimals: 0 },
      health: { label: 'Health', tech: 'SCOUT condition', unit: '%', start: 100, reserve: 25, tag: 'game', decimals: 0 },
    },

    rules: {
      // SCOUT follows NASA's VIPER rover (NTRS 20250004148, 20230004239).
      drive_speed_m_s: { value: 0.1, tag: 'nasa', note: 'VIPER prospecting speed' },
      slope_limit_deg: { value: 15, tag: 'nasa', note: 'VIPER slope design limit' },
      dark_limit_h: { value: 9, tag: 'nasa', note: 'VIPER batteries: about 9 h of operations in shadow' },
      // Everything below is a GAME VALUE.
      stops_h_per_leg: { value: 0.3, tag: 'game' },
      battery_kwh: { value: 10, tag: 'game', note: 'SCOUT battery size; 1% = 0.1 kWh' },
      drive_kw: { value: 1.0, tag: 'game' },
      solar_kw: { value: 1.5, tag: 'game' },
      heater_kw_in_shadow: { value: 2.0, tag: 'game' },
      climb_kwh_per_m: { value: 0.03, tag: 'game' },
      slope_health_at_limit: { value: 28, tag: 'game', note: 'Health lost if the steepest slope were at the 15 degree limit' },
      booster_health_factor: { value: 0.5, tag: 'game', note: 'With the booster Ana guides SCOUT through blind stretches' },
      convoy_time_factor: { value: 1.25, tag: 'game', note: 'ORION drives along: the convoy is slower' },
      known_route_time_factor: { value: 0.9, tag: 'game' },
    },

    // ORION's signal (emergency beacon). Counts mission hours, never real seconds.
    signal: { start: 7.5, search_h: 1.0, low_fraction: 0.25, tag: 'game' },

    sunScenarios: [
      { key: '0.5deg', label: 'very low', text: 'Today the Sun is very low. Shadows are long.' },
      { key: '1.0deg', label: 'low', text: 'Today the Sun is low. Some shadows.' },
      { key: '1.5deg', label: 'a bit higher', text: 'Today the Sun is a bit higher. Few shadows.' },
    ],

    // What the antenna fix really takes. Story, not data; costs are game values.
    fixes: [
      { id: 'cable', name: 'a loose antenna cable', hours: 1.0, battery: 10 },
      { id: 'bent', name: 'a bent antenna', hours: 2.0, battery: 17 },
      { id: 'mount', name: 'a cracked antenna mount', hours: 3.0, battery: 25 },
    ],
    fix: { base_chance: 0.5, checkup_bonus: 0.2, booster_bonus: 0.25, fail_health: 20, success_health: -5, tag: 'game' },

    routes: {
      direct: { name: 'Direct road', short: 'Direct' },
      balanced: { name: 'Balanced road', short: 'Balanced' },
      flattest: { name: 'Flattest road', short: 'Flattest' },
    },

    events: [
      { type: 'signal_loss', id: 'last_signal', title: 'The last signal', level: 1, demo: true, ask: 'Ana shows you how',
        choices: { locate: { label: "Find ORION's exact spot first", icon: 'radio', hours: 0.75, battery: 3 } } },
      { type: 'route_choice', id: 'choose_road', title: 'Choose the road', leg: 'out', level: 1, ask: 'Which road does SCOUT take?' },
      { type: 'low_light', id: 'into_shadows', title: 'Into the shadows', level: 1, check: 'cold', ask: 'A long shadow covers the road. What now?',
        choices: {
          wait: { label: 'Wait for the shadow to move', icon: 'wait', hours: 1.0 },
          drive: { label: 'Drive through on battery', icon: 'moon', battery_base: 4, health_base: 5, health_per_share: 20 },
          booster: { label: 'Build a signal booster on the ridge', icon: 'booster', hours: 1.25, battery: 6 },
        } },
      { type: 'particle_alert', id: 'solar_storm', title: 'Solar storm', level: 1, arrive_after: true, ask: 'Where does SCOUT hide and sleep?',
        choices: {
          crater: { label: 'Hide in the crater', icon: 'crater', hours: 3.0, battery: 2, health: 3, chip: 'Crater · blocks more · farther' },
          boulder: { label: 'Tuck beside the boulder', icon: 'boulder', hours: 2.0, battery: 2, health: 12, chip: 'Boulder · blocks less · close' },
        } },
      { type: 'find_rover', id: 'found_orion', title: 'Found ORION', level: 2, ask: 'What does SCOUT do first?',
        choices: {
          checkup: { label: 'Run a full check-up', icon: 'scan', hours: 1.0, battery: 5 },
          copy: { label: "Copy ORION's data first", icon: 'data', hours: 0.75, battery: 2 },
        } },
      { type: 'rescue', id: 'rescue_orion', title: 'Rescue ORION', level: 2, check: 'hear', ask: 'How do we help ORION?',
        choices: {
          fix: { label: "Fix ORION's antenna", icon: 'wrench' },
          leave: { label: "Copy ORION's data and head home", icon: 'data' },
          link: { label: 'Connect ORION to the signal booster', icon: 'link', hours: 0.75, battery: 5, locked_label: 'Needs the signal booster from the shadows' },
        },
        copy: { hours: 0.75, battery: 2 }, pack_up: { hours: 0.25, battery: 1 } },
      { type: 'route_choice', id: 'journey_home', title: 'The journey home', leg: 'home', level: 2, ask: 'Which road home?' },
    ],
    levels: { 1: 'Reach ORION', 2: 'Rescue and return' },

    endings: {
      accomplished: { title: 'Mission accomplished', text: 'ORION can hear us again and rolled home beside SCOUT.' },
      science: { title: 'Science secured', text: "ORION's ice data is safe. ORION waits. We will come back for it." },
      safe_data: { title: 'Safe return', text: "SCOUT reached a reserve and headed home safely with ORION's data. ORION keeps waiting." },
      safe: { title: 'Safe return', text: 'SCOUT reached a reserve and headed home safely. ORION keeps waiting. The crew is safe.' },
    },
  };
});
