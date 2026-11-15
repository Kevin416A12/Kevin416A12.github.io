# Junior Astronaut Mission Trainer — Saving Rover Orion

A browser game for ages 7–12, built for the NASA Space Apps Challenge 2026 challenge **"Build a Junior Astronaut Mission Trainer"** by team **Saving Rover Orion**.

ORION, a science rover, found ice near the Moon's south pole, then slipped into a dark crater and broke its main antenna. Its battery is dying and only a weak beacon calls for help. From Base Alpha, the player and Ana (a junior astronaut) drive SCOUT, a rescue rover, across real lunar terrain to save it. The crew is always safe inside the base.

**Team:** Nicole Taylor Marchena (Industrial Design Engineering), Kevin Castro Pérez (Computer Engineering), Isai Irías Salazar (Industrial Design Engineering) — Instituto Tecnológico de Costa Rica (TEC).

## Play

Open `index.html` in a browser, or serve the folder (`python3 -m http.server 8000`). No install, no build step, no network calls. It is a static site and works under any path, including GitHub Pages.

- iPad in landscape first; phones in landscape; desktop shows the game in a drawn iPad frame (`?frame=off` removes it).
- `?seed=1234` replays one exact day (the "day code" on the start screen). "Try again (same day)" does the same.
- `?sun=0.5deg|1.0deg|1.5deg`, `?fix=cable|bent|mount`, `?roll=0.3` pin a variant. `?fx=low` starts in low-effects mode.
- **For the demo video and the pitch: turn the iPad's Silent mode OFF, or nothing will play.** Music and voice start after the first tap.

## How a mission goes

Three bars: **Time**, **Battery** and **Health** (SCOUT's). **ORION's signal** counts down in mission hours, never real seconds: each decision's Time cost comes off it.

| Step | Decision | What it trades |
|---|---|---|
| 1 The last signal | Ana demonstrates: find ORION's exact spot first | Time now for certainty later |
| 2 Choose the road | Direct, Balanced or Flattest | Time against Battery and Health |
| 3 Into the shadows | Wait, drive through on battery, or build a signal booster | Time, Battery and Health; the booster pays off later |
| 4 Solar storm | Hide in the crater or tuck beside the boulder | Time against Health |
| 5 Found ORION | Full check-up or copy ORION's data first | Knowing the fix's real cost against saving the discovery at once |
| 6 Rescue ORION | Fix the antenna, copy the data and head home, or connect ORION to the booster | Risk against reward; the booster option is locked unless it was built |
| 7 The journey home | The same three roads, uphill | Keep enough to get home |

Every option card shows generated gain and cost tags, same-scale comparison bars, exact values and the effect on ORION's signal. One "Go" pill confirms. Reaching a striped reserve ends the mission with a **Safe return**; nothing is ever "game over".

## How the numbers are derived

Every number is **NASA data**, **our calculation from NASA data**, or a **game value**, and the in-game drawer ("How do we know?") labels each one.

- **Roads (our calculation from NASA data).** Least-cost paths on NASA LOLA 5 m slope data for Site01 "Connecting Ridge", never above 15°: Direct 934 m (steepest 11.5°), Balanced 948 m (6.7°), Flattest 1,331 m (4.4°). Grid paths run a few percent longer than a smooth line. They are possible roads on a map, not verified safe.
- **Time.** Road length ÷ 10 cm/s (NASA VIPER prospecting speed) + 0.3 h of stops (game value). VIPER's real "speed made good" is about 0.8 cm/s; it is mentioned in the drawer, not used.
- **Battery.** Driving use (grows with steepness, game values) + climbing (measured metres uphill) − solar recharge (our sunlight ranking of each road) + heaters in shadow. Shown as % of a 10 kWh battery (game value). Going home swaps the measured uphill and downhill, because Base Alpha is about 16 m higher, so the return always costs more Battery.
- **Health.** A game value with real triggers: 28% × (steepest slope ÷ 15°)², cold shadow, the weaker storm shelter, a failed fix. VIPER's design limits are 15° slopes, about 20 cm obstacles, about 9 h in shadow and 40 K to 300 K (NTRS 20250004148, 20240013903).
- **Sunlight.** Measured: LROC WAC shows the area sunlit about one hour in three (Speyerer & Robinson 2013). Modelled: horizon angles from the LOLA heights rank the roads and give the share in shadow; upper bounds, used only to compare roads.
- **Signal.** Our line-of-sight calculation on the LOLA heights (`data/signal_along_routes.json`): a clear path for the signal on only about 31–38% of each road and none at ORION's spot. What the booster gives is a game value.
- **Solar storm.** One of 14 real solar energetic particle records (NASA CCMC DONKI, May 2024) is drawn per day. Crater shielding of about 40% is from Phipps et al. (NASA GSFC). Health costs and waiting times are game values. The game never shows a radiation dose.
- **The antenna fix.** Costs and success chances are game values; no NASA dataset gives them. One dice roll per day code decides the outcome.
- **ORION's signal** (7.5 h) and the 1 h search are game values.

`tools/build_data.mjs` bundles `data/*.json` into `js/data.js`. Raw `.tif` and `.IMG` maps are not in this repository.

## Balance

All choice sequences, weighted by the dice (`npm run balance`): Mission accomplished 26.6%, Science secured 49.3%, Safe return 24%. Every day can be won.

ORION's signal on a medium day: fastest run (Direct, drive through, boulder) arrives with 1.9 h left; safest efficient run (Flattest, drive through, boulder) with 0.8 h; a careless run (Flattest, booster, crater) loses the signal and pays the search.

## Simplifications

- Solar particles are invisible; the storm picture shows where they come from.
- Sounds are SCOUT's radio and telemetry; space itself is silent.
- All pictures are illustrations based on NASA LOLA terrain, drawn in code. They are not photos and the map shapes are a sketch; only the numbers are measured.
- ORION, SCOUT, the relay satellite, Base Alpha and Ana are story.

## Project layout

`js/engine.js` (rules, no DOM) · `js/pack_moon.js` (the world: constants with source tags, wording) · `js/lines.js` (Ana's lines) · `js/art.js` (code-drawn SVG) · `js/ui.js` · `css/style.css` · `audio/music/music.js`, `audio/sfx/sfx.js`, `audio/voice/ana/voice.js` (manifests: swap files without touching game code) · `tests/` (`npm test`, 14 tests incl. full enumeration) · `scripts/` (Python used to process the NASA maps; `make_voice.py` for Ana's voice).

The manifests are `.js` rather than `.json` so the game also runs from a double-clicked file.

## Next version

Badges as medals with reveal cards · Ana's recorded Kokoro voice inside the app (`scripts/make_voice.py` is ready) · the full sound map · realistic pre-rendered world textures · Calm / Normal / Intense effect levels · a Mars environment pack.

## Credits, licence, AI use

**Contains an AI-generated logo and AI-generated voice.** The logo carries an "AI-generated" label in the game; Ana's voice is synthetic (browser speech in the game, Kokoro-82M in the demo video).

See `CREDITS.md`. Code and code-drawn art: MIT (`LICENSE`). NASA does not endorse this project; no NASA marks are used.
