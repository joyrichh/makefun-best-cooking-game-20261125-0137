import { FIXED_STEP } from './config.js';
import { isMuted, playChop, playCoin, playDing, playError, playRush, playServe, playSizzle, setMuted, toggleMuted } from './audio.js';
import { createInput } from './input.js';
import { drawKitchen, drawHud, drawGameOver, drawPaused, drawTitle, render } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT, popEvents, update } from './world.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d', { alpha: false });
const status = document.querySelector('#status');
const input = createInput(canvas);
const search = new URLSearchParams(window.location.search);
const parsedSeed = Number(search.get('seed') ?? 7);
const seed = Number.isFinite(parsedSeed) ? parsedSeed >>> 0 : 7;
const shotName = search.get('shot');

const stagedShot = shotName ? stageShot(shotName, seed) : null;
let world = stagedShot?.world ?? createWorld(seed);
let screen = stagedShot?.screen ?? 'title';
let simulationElapsed = 0;
let previousFrameTime = 0;
let sizzleTimer = 0;

if (shotName) {
  paint();
  paint();
  window.__shotReady = true;
  canvas.dataset.shotReady = 'true';
  document.title = `Kuali Kilat — ${shotName} ready`;
  status.textContent = `Screenshot scene ${shotName} ready. Kuali Kilat.`;
} else {
  paint();
  requestAnimationFrame(frame);
}

function paint() {
  render(context, world, screen, isMuted());
}

function startShift() {
  world = createWorld(seed);
  screen = 'play';
  status.textContent = 'Shift started. Pick up an ingredient near its crate and follow the order tickets.';
}

function processInput(state) {
  if (state.mutePressed) {
    toggleMuted();
    status.textContent = isMuted() ? 'Sound off.' : 'Sound on.';
  }

  if (screen === 'title') {
    if (state.startPressed || state.click) startShift();
    return null;
  }
  if (screen === 'over') {
    if (state.restartPressed || state.startPressed || state.click) startShift();
    return null;
  }
  if (state.pausePressed) {
    screen = screen === 'paused' ? 'play' : 'paused';
    status.textContent = screen === 'paused' ? 'Shift paused.' : 'Shift resumed.';
  }
  return screen === 'play' ? state : null;
}

function playWorldEvents(delta) {
  for (const event of popEvents(world)) {
    if (event.type === EVENT.ORDER) playDing();
    else if (event.type === EVENT.CHOP) playChop();
    else if (event.type === EVENT.SERVE) { playServe(); playCoin(); status.textContent = `${event.dish} served. ${event.coins} coins; combo ${event.combo}.`; }
    else if (event.type === EVENT.EXPIRE || event.type === EVENT.ERROR || event.type === EVENT.BURN) playError();
    else if (event.type === EVENT.RUSH) { playRush(); status.textContent = 'Rush is on. Tips are doubled!'; }
  }

  if (world.wokItem && !world.wokItem.burnt) {
    sizzleTimer += delta;
    if (sizzleTimer >= 0.9) { playSizzle(); sizzleTimer = 0; }
  } else sizzleTimer = 0;
}

function frame(timestamp) {
  const elapsed = previousFrameTime ? Math.min(0.1, (timestamp - previousFrameTime) / 1000) : 0;
  previousFrameTime = timestamp;

  if (screen !== 'paused') simulationElapsed += elapsed;
  while (simulationElapsed >= FIXED_STEP) {
    const controls = input.read();
    const worldInput = processInput(controls);
    if (worldInput) update(world, worldInput, FIXED_STEP);
    if (screen === 'over' || world.over) {
      screen = 'over';
      status.textContent = 'Shift complete. Press R or Enter to restart.';
    }
    if (worldInput) playWorldEvents(FIXED_STEP);
    simulationElapsed -= FIXED_STEP;
  }
  if (screen === 'title' || screen === 'paused' || screen === 'over') {
    const controls = input.read();
    const result = processInput(controls);
    if (result) update(world, result, FIXED_STEP);
  }

  paint();
  requestAnimationFrame(frame);
}
