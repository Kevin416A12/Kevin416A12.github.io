// Everything Ana says, one id per line (12 words or fewer; story panels may be longer).
// voice/VOICE_LINES.md is generated from this file: node tools/build_voice_lines.mjs
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SRO_LINES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const L = (text, mood) => ({ text, mood });
  return {
    story_1: L("ORION found ice near the Moon's south pole. Future astronauts need it!", 'celebrate'),
    story_2: L('Then it fell into a dark crater, and its antenna broke.', 'worried'),
    story_3: L('Its battery is dying. Only a weak beacon calls for help. Save ORION!', 'alarm'),

    e1_ctx: L("ORION's signal reached us through a satellite. Watch my first move.", 'curious'),
    e1_why: L("Time is precious. ORION's signal gets weaker every hour.", 'calm'),
    hint_e1: L('Knowing the exact spot saves SCOUT from searching later.', 'curious'),
    r_locate: L("Got it. Now we know exactly where ORION's signal comes from.", 'calm'),

    e2_ctx: L('Three roads lead to ORION. Each one costs something different.', 'curious'),
    nasa_first: L('See this little satellite? It means real NASA data!', 'celebrate'),
    hint_e2: L('The short road is fast, but steep slopes can hurt SCOUT.', 'curious'),
    r_route_direct: L("Steep road. The shortest road isn't always the best.", 'worried'),
    r_route_balanced: L('Gentle slopes. A steady drive for SCOUT.', 'calm'),
    r_route_flattest: L('The long, sunny road. SCOUT recharges as it drives.', 'calm'),

    e3_ctx: L('The Sun is low here, so shadows are long and cold.', 'curious'),
    e3_booster: L('A signal booster on the ridge lets messages hop over the hill.', 'curious'),
    hint_e3: L('Waiting costs Time. The dark costs Battery and Health.', 'curious'),
    r_wait: L('The shadow moved on. SCOUT rolls in sunlight again.', 'calm'),
    r_drive_dark: L('Through the cold dark. The heaters work hard.', 'worried'),
    r_booster: L('Booster built! Now I can guide SCOUT behind the hills.', 'celebrate'),
    q_cold: L("Quick check. Did the cold dark hurt SCOUT's Health?", 'curious'),

    e4_ctx: L('Solar storm! Tiny, fast particles from the Sun. Protect SCOUT!', 'alarm'),
    e4_safe: L('We are safe in the base shelter. SCOUT must hide and sleep.', 'worried'),
    hint_e4: L('Crater walls block more particles, but the crater is farther.', 'curious'),
    r_shelter_crater: L('SCOUT slept behind the crater walls. Almost no harm.', 'calm'),
    r_shelter_boulder: L('The boulder blocked some particles. SCOUT took a few hits.', 'worried'),

    arr_on: L("There it is! We followed ORION's signal all the way.", 'celebrate'),
    arr_off: L("We lost ORION's signal. SCOUT will search the last known spot.", 'worried'),
    arr_found: L('Found it. The search cost us an extra hour.', 'calm'),
    sig_low: L("ORION's signal is getting weak. We need to hurry.", 'worried'),
    level2: L('Hello, ORION! Now let us get you out of there.', 'celebrate'),

    e5_ctx: L('ORION is stuck in the dark. Its main antenna is broken.', 'curious'),
    hint_e5: L('Checking first costs time, but it tells us what the fix costs.', 'curious'),
    r_checkup_cable: L('Check-up done: a loose antenna cable. A quick fix.', 'calm'),
    r_checkup_bent: L('Check-up done: a bent antenna. A medium fix.', 'calm'),
    r_checkup_mount: L('Check-up done: a cracked antenna mount. A long fix.', 'worried'),
    r_copy: L("ORION's ice data is copied. The discovery is safe.", 'celebrate'),

    e6_ctx_known: L('We know what the fix costs. Can SCOUT still get home?', 'calm'),
    e6_ctx_blind: L('We skipped the check-up, so the fix cost is not sure.', 'worried'),
    e6_locked: L('If we had built a signal booster earlier, we could connect ORION.', 'curious'),
    e6_unlocked: L('We built the booster! We can connect ORION to it.', 'celebrate'),
    hint_e6: L('Look at the home flags. Keep enough to drive back.', 'curious'),
    r_fix_ok: L('ORION can hear us! It is climbing out into the sunlight.', 'celebrate'),
    r_fix_fail: L('The fix did not hold. We copied the data instead.', 'worried'),
    r_leave: L('Data packed. We will come back for you, ORION.', 'calm'),
    r_link: L('Connected! ORION hears me and drives itself out.', 'celebrate'),
    q_hear: L('Quick check. Can ORION hear Ana now?', 'curious'),

    e7_ctx: L('Time to go home. Base Alpha is uphill from here.', 'calm'),
    e7_convoy: L('ORION drives beside SCOUT, so we go a bit slower.', 'calm'),
    hint_e7: L('Stay above the stripes. Uphill uses more Battery.', 'curious'),
    r_home: L('Heading home to Base Alpha.', 'calm'),

    warn_reserve: L('Careful. That choice dips into a safety reserve.', 'worried'),
    warn_all: L('Every choice needs a reserve now. Pick the smallest cost.', 'alarm'),
    warn_home: L('One bar is below its home flag. Spend carefully.', 'worried'),
    breach: L('SCOUT reached a reserve. It is heading home safely.', 'worried'),

    check_right: L('Yes! Great thinking.', 'celebrate'),
    check_notyet: L("Not yet. Here's why.", 'curious'),
    combo: L('Three in a row. Great mission thinking!', 'celebrate'),

    quiz_1: L('Why is a steep road risky for SCOUT?', 'curious'),
    quiz_2: L('Why hide SCOUT in a crater during a solar storm?', 'curious'),
    quiz_3: L('What does a signal booster do?', 'curious'),

    end_accomplished: L('ORION is rolling home beside SCOUT. Outstanding plan!', 'celebrate'),
    end_science: L("ORION's discovery is safe. I promise we will come back.", 'celebrate'),
    end_safe: L("Everyone is safe. Let's plan it better.", 'calm'),
  };
});
