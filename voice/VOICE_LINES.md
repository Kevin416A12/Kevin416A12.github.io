# Ana — voice lines

Generated from `js/lines.js`. Edit that file, then run `node tools/build_voice_lines.mjs`.

**Character:** Ana, junior astronaut, about 11–12. Calm, capable, friendly. Not a cartoon voice.

**Recordings:** `python3 scripts/make_voice.py` (Kokoro-82M, voice af_heart) writes `audio/voice/ana/<id>.mp3` and rebuilds `audio/voice/ana/voice.js`. Lines without a clip use the browser voice.

| id | text | mood | words |
|---|---|---|---|
| `story_1` | ORION found ice near the Moon's south pole. Future astronauts need it! | celebrate | 12 |
| `story_2` | Then it fell into a dark crater, and its antenna broke. | worried | 11 |
| `story_3` | Its battery is dying. Only a weak beacon calls for help. Save ORION! | alarm | 13 |
| `e1_ctx` | ORION's signal reached us through a satellite. Watch my first move. | curious | 11 |
| `e1_why` | Time is precious. ORION's signal gets weaker every hour. | calm | 9 |
| `hint_e1` | Knowing the exact spot saves SCOUT from searching later. | curious | 9 |
| `r_locate` | Got it. Now we know exactly where ORION's signal comes from. | calm | 11 |
| `e2_ctx` | Three roads lead to ORION. Each one costs something different. | curious | 10 |
| `nasa_first` | See this little satellite? It means real NASA data! | celebrate | 9 |
| `hint_e2` | The short road is fast, but steep slopes can hurt SCOUT. | curious | 11 |
| `r_route_direct` | Steep road. The shortest road isn't always the best. | worried | 9 |
| `r_route_balanced` | Gentle slopes. A steady drive for SCOUT. | calm | 7 |
| `r_route_flattest` | The long, sunny road. SCOUT recharges as it drives. | calm | 9 |
| `e3_ctx` | The Sun is low here, so shadows are long and cold. | curious | 11 |
| `e3_booster` | A signal booster on the ridge lets messages hop over the hill. | curious | 12 |
| `hint_e3` | Waiting costs Time. The dark costs Battery and Health. | curious | 9 |
| `r_wait` | The shadow moved on. SCOUT rolls in sunlight again. | calm | 9 |
| `r_drive_dark` | Through the cold dark. The heaters work hard. | worried | 8 |
| `r_booster` | Booster built! Now I can guide SCOUT behind the hills. | celebrate | 10 |
| `q_cold` | Quick check. Did the cold dark hurt SCOUT's Health? | curious | 9 |
| `e4_ctx` | Solar storm! Tiny, fast particles from the Sun. Protect SCOUT! | alarm | 10 |
| `e4_safe` | We are safe in the base shelter. SCOUT must hide and sleep. | worried | 12 |
| `hint_e4` | Crater walls block more particles, but the crater is farther. | curious | 10 |
| `r_shelter_crater` | SCOUT slept behind the crater walls. Almost no harm. | calm | 9 |
| `r_shelter_boulder` | The boulder blocked some particles. SCOUT took a few hits. | worried | 10 |
| `arr_on` | There it is! We followed ORION's signal all the way. | celebrate | 10 |
| `arr_off` | We lost ORION's signal. SCOUT will search the last known spot. | worried | 11 |
| `arr_found` | Found it. The search cost us an extra hour. | calm | 9 |
| `sig_low` | ORION's signal is getting weak. We need to hurry. | worried | 9 |
| `level2` | Hello, ORION! Now let us get you out of there. | celebrate | 10 |
| `e5_ctx` | ORION is stuck in the dark. Its main antenna is broken. | curious | 11 |
| `hint_e5` | Checking first costs time, but it tells us what the fix costs. | curious | 12 |
| `r_checkup_cable` | Check-up done: a loose antenna cable. A quick fix. | calm | 9 |
| `r_checkup_bent` | Check-up done: a bent antenna. A medium fix. | calm | 8 |
| `r_checkup_mount` | Check-up done: a cracked antenna mount. A long fix. | worried | 9 |
| `r_copy` | ORION's ice data is copied. The discovery is safe. | celebrate | 9 |
| `e6_ctx_known` | We know what the fix costs. Can SCOUT still get home? | calm | 11 |
| `e6_ctx_blind` | We skipped the check-up, so the fix cost is not sure. | worried | 11 |
| `e6_locked` | If we had built a signal booster earlier, we could connect ORION. | curious | 12 |
| `e6_unlocked` | We built the booster! We can connect ORION to it. | celebrate | 10 |
| `hint_e6` | Look at the home flags. Keep enough to drive back. | curious | 10 |
| `r_fix_ok` | ORION can hear us! It is climbing out into the sunlight. | celebrate | 11 |
| `r_fix_fail` | The fix did not hold. We copied the data instead. | worried | 10 |
| `r_leave` | Data packed. We will come back for you, ORION. | calm | 9 |
| `r_link` | Connected! ORION hears me and drives itself out. | celebrate | 8 |
| `q_hear` | Quick check. Can ORION hear Ana now? | curious | 7 |
| `e7_ctx` | Time to go home. Base Alpha is uphill from here. | calm | 10 |
| `e7_convoy` | ORION drives beside SCOUT, so we go a bit slower. | calm | 10 |
| `hint_e7` | Stay above the stripes. Uphill uses more Battery. | curious | 8 |
| `r_home` | Heading home to Base Alpha. | calm | 5 |
| `warn_reserve` | Careful. That choice dips into a safety reserve. | worried | 8 |
| `warn_all` | Every choice needs a reserve now. Pick the smallest cost. | alarm | 10 |
| `warn_home` | One bar is below its home flag. Spend carefully. | worried | 9 |
| `breach` | SCOUT reached a reserve. It is heading home safely. | worried | 9 |
| `check_right` | Yes! Great thinking. | celebrate | 3 |
| `check_notyet` | Not yet. Here's why. | curious | 4 |
| `combo` | Three in a row. Great mission thinking! | celebrate | 7 |
| `quiz_1` | Why is a steep road risky for SCOUT? | curious | 8 |
| `quiz_2` | Why hide SCOUT in a crater during a solar storm? | curious | 10 |
| `quiz_3` | What does a signal booster do? | curious | 6 |
| `end_accomplished` | ORION is rolling home beside SCOUT. Outstanding plan! | celebrate | 8 |
| `end_science` | ORION's discovery is safe. I promise we will come back. | celebrate | 10 |
| `end_safe` | Everyone is safe. Let's plan it better. | calm | 7 |
