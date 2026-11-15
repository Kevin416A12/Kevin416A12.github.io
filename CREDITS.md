# Credits

## Team — Saving Rover Orion

- Nicole Taylor Marchena — Industrial Design Engineering
- Kevin Castro Pérez — Computer Engineering
- Isai Irías Salazar — Industrial Design Engineering

Instituto Tecnológico de Costa Rica (TEC). NASA Space Apps Challenge 2026.

## NASA data and research

| What | Source |
|---|---|
| Terrain and slopes | NASA LRO Lunar Orbiter Laser Altimeter (LOLA), 5 m/pixel, Site01 "Connecting Ridge", NASA PGDA: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site01/ |
| Measured sunlight | LROC WAC polar illumination map `WAC_POLE_ILL_PCT_SOUTH_100M` v1.3. Speyerer, E. J., & Robinson, M. S. (2013). *Icarus*, 222(1), 122–136. https://doi.org/10.1016/j.icarus.2012.10.010 |
| Solar storms | NASA CCMC DONKI (flares and solar energetic particle records, May 2024): https://ccmc.gsfc.nasa.gov/tools/DONKI/ . Research data, not an official forecast. |
| Rover speed and limits | NASA VIPER documents: https://ntrs.nasa.gov/citations/20250004148 , https://ntrs.nasa.gov/citations/20230004239 , https://ntrs.nasa.gov/citations/20240013903 |
| Crater shielding | Phipps et al., NASA GSFC: https://ntrs.nasa.gov/citations/20210021041 , https://ntrs.nasa.gov/citations/20210021039 |
| Site coordinates | NASA Lunar Surface Data Book ACD-50044 (Site01) |

NASA does not endorse this project. No NASA insignia, logotype or seal is used.

## Music (Pixabay Content License)

Track names and authors are taken from the Pixabay file names.

| Game state | Track | Author |
|---|---|---|
| Start screen | Calm Space Music | Clavier-Music |
| Mission | Sci-Fi Documentary | leberch |
| Solar storm | Dystopian World (Epic Dystopian Cinematic) | WBMStudio |
| Journey home and endings | Tech Sparks | JoyInSound |

## Sound effects

Kenney "Digital Audio" (CC0), https://kenney.nl . Eight files, renamed in `audio/sfx/` (the mapping is in `audio/sfx/sfx.js`), each shipped as `.ogg` and `.mp3`. Other sounds are synthesised in the browser.

## Font and icons

- **Michroma** — SIL Open Font License 1.1 (`fonts/Michroma-LICENSE.txt`), self-hosted.
- **Phosphor Icons** — MIT (`assets/Phosphor-LICENSE.txt`). The small satellite icon is drawn by us, because Phosphor has none.

## Voice

Ana's lines use the browser's built-in speech. `scripts/make_voice.py` can generate recorded clips with **Kokoro-82M** (Apache 2.0, voice `af_heart`); no clips are included in this version.

## AI-use declaration

**Contains an AI-generated logo and AI-generated voice.**

- **Team logo** (`assets/brand/logo.png`): AI-generated. It carries a visible "AI-generated" label wherever it appears in the game.
- **Code, code-drawn artwork (scenes, SCOUT, ORION, Ana, icons we drew), tests and documentation:** written with AI assistance (Claude by Anthropic) and reviewed by the team.
- **Ana's voice:** synthetic. In the game: the browser's built-in speech. In the demo video: Kokoro-82M (Apache 2.0), voice `af_heart`.
- **Data processing scripts:** written with AI assistance; the team downloaded the NASA data and checked the numbers against the source files.
- Music and sound effects are not AI-generated.
