// Sound-effect manifest: interaction → file (without extension; .ogg and .mp3 copies exist), reason, volume.
// Source: Kenney "Digital Audio" (CC0). Interactions not listed here use the built-in synthesised beeps.
// All sounds are explained in-world as SCOUT's radio and telemetry: no sound travels through vacuum.
window.SRO_SFX = {
  go: { file: 'go', from: 'twoTone1', reason: 'confident two-tone confirm', volume: 0.5 },
  warning: { file: 'warning', from: 'twoTone2', reason: 'two short mid beeps for warnings and locked options', volume: 0.45 },
  win: { file: 'win', from: 'threeTone1', reason: 'bright three-note chime', volume: 0.55 },
  lose: { file: 'lose', from: 'lowDown', reason: 'soft falling tone, never a buzzer', volume: 0.4 },
  found: { file: 'found', from: 'threeTone2', reason: "ORION's own beep melody answering SCOUT", volume: 0.6 },
  unlock: { file: 'unlock', from: 'powerUp5', reason: 'electronic power-up for the signal booster', volume: 0.45 },
  badge: { file: 'badge', from: 'highUp', reason: 'short rising chime for a badge', volume: 0.45 },
  storm: { file: 'storm', from: 'lowThreeTone', reason: 'low three-tone alarm under the storm music', volume: 0.5 },
};
