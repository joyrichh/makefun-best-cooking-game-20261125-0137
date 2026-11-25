import { INGREDIENTS, PLAYER_SPEED, RECIPES, SCORING, SHIFT_LENGTH, STATIONS, TIMING, WALK_BOX } from './config.js';
import { chooseRandom, mulberry32 } from './random.js';

export const EVENT = Object.freeze({ ORDER: 'order', EXPIRE: 'expire', CHOP: 'chop', COOK: 'cook', BURN: 'burn', ADD: 'add', SERVE: 'serve', ERROR: 'error', TRASH: 'trash', RUSH: 'rush', COIN: 'coin' });
const EMPTY_INPUT = { up: false, down: false, left: false, right: false, interact: false, interactPressed: false, click: null };

export function createWorld(seed = 7) {
  return {
    seed: seed >>> 0,
    random: mulberry32(seed >>> 0),
    time: 0,
    remaining: SHIFT_LENGTH,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    nextOrder: 0,
    spawnAt: 0,
    player: { x: 400, y: 554, facing: 1, carried: null, target: null },
    boardItem: null,
    boardProgress: 0,
    wokItem: null,
    wokProgress: 0,
    plate: { items: [] },
    floating: [],
    events: [],
    messages: [],
    rush: false,
    over: false,
    serveWindowReady: false,
  };
}

export function reset(seed = 7) { return createWorld(seed); }

export function emitEvent(world, type, data = {}) {
  world.events.push({ type, ...data });
}

export function popEvents(world) {
  const pending = world.events.splice(0);
  return pending;
}

export function spawnOrder(world, recipe = chooseRandom(world.random, RECIPES)) {
  if (world.orders.length >= TIMING.maxOrders) return null;
  const patience = recipe.patience ?? TIMING.patience;
  const order = { id: world.nextOrder++, recipe, remaining: patience, patience, serial: world.nextOrder };
  world.orders.push(order);
  emitEvent(world, EVENT.ORDER, { dish: recipe.name });
  return order;
}

function floatText(world, text, x = world.player.x, y = world.player.y - 54, color = '#fff1c4') {
  world.floating.push({ text, x, y, life: 1.35, color });
}

function distanceSquared(point, position) {
  return (point.x - position.x) ** 2 + (point.y - position.y) ** 2;
}

function nearbyStation(world, station) {
  const point = { x: world.player.x, y: world.player.y + 23 };
  return distanceSquared(point, station) < 115 ** 2;
}

export function pickUp(world, ingredientId) {
  const definition = INGREDIENTS[ingredientId];
  if (!definition || world.player.carried || world.over) return false;
  const crate = STATIONS.crates[ingredientId];
  if (!nearbyStation(world, crate)) return false;
  world.player.carried = makeIngredient(ingredientId);
  floatText(world, `${definition.name} picked up`);
  return true;
}

function makeIngredient(id) {
  return { id, prepped: [], burnt: false };
}

function hasPrep(item, step) {
  return item.prepped.includes(step);
}

function nextPreparation(item) {
  return INGREDIENTS[item.id].prep.find((step) => !hasPrep(item, step));
}

export function startChop(world) {
  if (!nearbyStation(world, STATIONS.board)) return false;
  if (world.player.carried) {
    const item = world.player.carried;
    if (item.burnt || !INGREDIENTS[item.id].prep.includes('chop') || hasPrep(item, 'chop') || world.boardItem) return false;
    world.boardItem = item;
    world.player.carried = null;
    world.boardProgress = 0;
    return true;
  }
  if (world.boardItem && world.boardProgress >= TIMING.chop - 1e-6) {
    world.player.carried = world.boardItem;
    world.player.carried.prepped.push('chop');
    world.boardItem = null;
    world.boardProgress = 0;
    floatText(world, 'Chop complete!', world.player.x, world.player.y - 54, '#bbf39b');
    emitEvent(world, EVENT.CHOP);
    return true;
  }
  return false;
}

export function startCook(world) {
  if (!nearbyStation(world, STATIONS.wok)) return false;
  if (world.player.carried) {
    const item = world.player.carried;
    if (item.burnt || !INGREDIENTS[item.id].prep.includes('cook') || hasPrep(item, 'cook') || nextPreparation(item) !== 'cook' || world.wokItem) return false;
    world.wokItem = item;
    world.player.carried = null;
    world.wokProgress = 0;
    emitEvent(world, EVENT.COOK, { start: true, item: item.id });
    return true;
  }
  if (world.wokItem && world.wokProgress >= TIMING.cook - 1e-6 && world.wokProgress < TIMING.cook + TIMING.burn) {
    world.player.carried = world.wokItem;
    world.player.carried.prepped.push('cook');
    world.wokItem = null;
    world.wokProgress = 0;
    floatText(world, 'Perfectly cooked!', world.player.x, world.player.y - 54, '#ffcf70');
    return true;
  }
  return false;
}

export function addToPlate(world) {
  if (!nearbyStation(world, STATIONS.plate)) return false;
  if (world.player.carried?.type === 'plate') {
    world.player.carried.x = STATIONS.plate.x;
    world.player.carried.y = STATIONS.plate.y;
    world.plate = world.player.carried;
    world.player.carried = null;
    return true;
  }
  if (!world.player.carried && matchingPlateRecipe(world.plate)) {
    world.player.carried = { type: 'plate', items: world.plate.items.map((item) => ({ ...item, prepped: [...item.prepped] })), x: STATIONS.plate.x, y: STATIONS.plate.y };
    world.plate = { items: [] };
    return true;
  }
  const item = world.player.carried;
  if (!item || item.type === 'plate' || item.burnt || nextPreparation(item) || world.plate.items.length >= 4) return false;
  world.plate.items.push({ id: item.id, prepped: [...item.prepped], burnt: false });
  world.player.carried = null;
  emitEvent(world, EVENT.ADD, { item: item.id, count: world.plate.items.length });
  floatText(world, `${INGREDIENTS[item.id].name} plated`, STATIONS.plate.x, STATIONS.plate.y - 56, '#ffdf93');
  const recipe = matchingPlateRecipe(world.plate);
  if (recipe) floatText(world, `${recipe.name} is ready!`, STATIONS.plate.x, STATIONS.plate.y - 83, '#adf6a9');
  return true;
}

function sameComponents(actual, required) {
  if (actual.length !== required.length) return false;
  const remaining = [...required];
  for (const item of actual) {
    const index = remaining.findIndex((component) => component.id === item.id && component.prep.length === item.prepped.length && component.prep.every((step) => item.prepped.includes(step)));
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

export function matchingPlateRecipe(plate) {
  if (!plate?.items?.length) return null;
  return RECIPES.find((recipe) => sameComponents(plate.items, recipe.components)) ?? null;
}

function orderMatchesPlate(order, plate) {
  return sameComponents(plate.items, order.recipe.components);
}

export function servePlate(world) {
  if (!world.player.carried || world.player.carried.type !== 'plate' || !nearbyStation(world, STATIONS.serve)) return false;
  const plate = world.player.carried;
  const recipe = matchingPlateRecipe(plate);
  const orderIndex = world.orders.findIndex((order) => orderMatchesPlate(order, plate));
  if (orderIndex < 0) {
    emitEvent(world, EVENT.ERROR, { message: 'Wrong dish' });
    floatText(world, 'SALAH!', STATIONS.serve.x, STATIONS.serve.y - 88, '#ff7163');
    world.messages.push({ text: 'SALAH! No open ticket matches that dish.', life: 2.2 });
    return false;
  }
  const [order] = world.orders.splice(orderIndex, 1);
  const onTime = order.remaining > order.patience * 0.15;
  world.combo = onTime ? world.combo + 1 : 0;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const comboMultiplier = world.combo >= TIMING.comboSteps ? 3 : world.combo >= 2 ? 2 : 1;
  const remainingRatio = Math.max(0, order.remaining / order.patience);
  const rushMultiplier = world.rush ? SCORING.rushTips : 1;
  const tip = Math.round(order.recipe.tip * remainingRatio * rushMultiplier);
  const earned = order.recipe.price + tip * comboMultiplier;
  world.coins += earned;
  world.served++;
  world.player.carried = null;
  world.plate = { items: [] };
  world.serveWindowReady = true;
  floatText(world, `+${earned} COINS`, STATIONS.serve.x, STATIONS.serve.y - 77, '#ffe48b');
  emitEvent(world, EVENT.SERVE, { dish: recipe.name, coins: earned, combo: world.combo });
  return true;
}

export function trashCarried(world) {
  if (!nearbyStation(world, STATIONS.trash)) return false;
  if (world.player.carried?.type === 'plate') {
    const plate = world.player.carried;
    if (!plate.items.length) { world.player.carried = null; return true; }
    const removed = plate.items.pop();
    floatText(world, `${INGREDIENTS[removed.id].name} dumped`, STATIONS.trash.x, STATIONS.trash.y - 42, '#ffab85');
    emitEvent(world, EVENT.TRASH, { item: removed.id });
    return true;
  }
  if (world.player.carried?.burnt) {
    const removed = world.player.carried.id;
    world.player.carried = null;
    floatText(world, 'Burnt food trashed', STATIONS.trash.x, STATIONS.trash.y - 42, '#ffab85');
    emitEvent(world, EVENT.TRASH, { item: removed, burnt: true });
    return true;
  }
  if (world.player.carried) {
    world.player.carried = null;
    emitEvent(world, EVENT.TRASH);
    return true;
  }
  if (world.wokItem?.burnt) { world.wokItem = null; world.wokProgress = 0; emitEvent(world, EVENT.TRASH); return true; }
  if (world.boardItem?.burnt) { world.boardItem = null; world.boardProgress = 0; emitEvent(world, EVENT.TRASH); return true; }
  if (world.plate.items.length) { world.plate.items.pop(); emitEvent(world, EVENT.TRASH); return true; }
  return false;
}

export function expireOrders(world) {
  for (let index = world.orders.length - 1; index >= 0; index--) {
    const order = world.orders[index];
    order.remaining -= 1 / 60;
    if (order.remaining <= 0) {
      world.orders.splice(index, 1);
      world.coins = Math.max(0, world.coins - SCORING.expiryPenalty);
      world.combo = 0;
      floatText(world, 'ORDER LOST  −15', 641, 168, '#ff7363');
      emitEvent(world, EVENT.EXPIRE, { dish: order.recipe.name, penalty: SCORING.expiryPenalty });
    }
  }
}

function runPlayer(world, input, delta) {
  const player = world.player;
  let directionX = Number(input.right) - Number(input.left);
  let directionY = Number(input.down) - Number(input.up);
  const magnitude = Math.hypot(directionX, directionY) || 1;
  directionX /= magnitude;
  directionY /= magnitude;

  if (!directionX && !directionY && player.target) {
    const dx = player.target.x - player.x;
    const dy = player.target.y - player.y;
    if (Math.abs(dx) > 7) directionX = Math.sign(dx);
    else if (Math.abs(dy) > 7) directionY = Math.sign(dy);
    else player.target = null;
  }

  player.x = Math.max(WALK_BOX.left, Math.min(WALK_BOX.right, player.x + directionX * PLAYER_SPEED * delta));
  player.y = Math.max(WALK_BOX.top, Math.min(WALK_BOX.bottom, player.y + directionY * PLAYER_SPEED * delta));
  if (directionX) player.facing = Math.sign(directionX);

  if (input.click) {
    const clickedCrate = Object.entries(STATIONS.crates).find(([, station]) => Math.hypot(input.click.x - station.x, input.click.y - station.y) < 54);
    const clickedWorkArea = [STATIONS.serve, STATIONS.plate, STATIONS.board, STATIONS.wok, STATIONS.trash].some((station) => Math.hypot(input.click.x - station.x, input.click.y - station.y) < 87);
    player.autoInteract = Boolean(clickedCrate || clickedWorkArea);
    player.target = { x: Math.max(WALK_BOX.left, Math.min(WALK_BOX.right, input.click.x)), y: Math.max(WALK_BOX.top, Math.min(WALK_BOX.bottom, input.click.y)) };
    if (player.carried?.type === 'plate' && Math.hypot(input.click.x - STATIONS.serve.x, input.click.y - STATIONS.serve.y) < 105) player.target = { x: STATIONS.serve.x - 42, y: STATIONS.serve.y + 55 };
    else if (Math.hypot(input.click.x - STATIONS.plate.x, input.click.y - STATIONS.plate.y) < 120) player.target = { x: STATIONS.plate.x - 14, y: STATIONS.plate.y + 83 };
    else if (Math.hypot(input.click.x - STATIONS.board.x, input.click.y - STATIONS.board.y) < 114) player.target = { x: STATIONS.board.x - 10, y: STATIONS.board.y + 88 };
    else if (Math.hypot(input.click.x - STATIONS.wok.x, input.click.y - STATIONS.wok.y) < 116) player.target = { x: STATIONS.wok.x - 10, y: STATIONS.wok.y + 90 };
    else if (Math.hypot(input.click.x - STATIONS.serve.x, input.click.y - STATIONS.serve.y) < 110) player.target = { x: STATIONS.serve.x - 42, y: STATIONS.serve.y + 55 };
    else {
      const crate = Object.entries(STATIONS.crates).find(([, station]) => Math.hypot(input.click.x - station.x, input.click.y - station.y) < 51);
      if (crate) player.target = { x: crate[1].x + 61, y: crate[1].y + 20 };
      else if (Math.hypot(input.click.x - STATIONS.trash.x, input.click.y - STATIONS.trash.y) < 83) player.target = { x: STATIONS.trash.x - 44, y: STATIONS.trash.y + 58 };
    }
  }

  if (!directionX && !directionY && player.target && Math.abs(player.target.x - player.x) <= 7 && Math.abs(player.target.y - player.y) <= 7) {
    player.target = null;
  }
  if (!player.target && player.autoInteract) {
    player.autoInteract = false;
    stationAction(world);
  }

  return Boolean(directionX || directionY);
}

function stationAction(world) {
  const player = world.player;
  const order = [STATIONS.serve, STATIONS.plate, STATIONS.board, STATIONS.wok, STATIONS.trash];
  for (const station of order) {
    if (!nearbyStation(world, station)) continue;
    if (station === STATIONS.serve && servePlate(world)) return true;
    if (station === STATIONS.plate) {
      if (!player.carried && matchingPlateRecipe(world.plate)) { player.carried = { ...world.plate, items: world.plate.items.map((item) => ({ ...item, prepped: [...item.prepped] })) }; world.plate = { items: [] }; return true; }
      if (addToPlate(world)) return true;
    }
    if (station === STATIONS.board && startChop(world)) return true;
    if (station === STATIONS.wok && startCook(world)) return true;
    if (station === STATIONS.trash && trashCarried(world)) return true;
  }
  const crate = Object.entries(STATIONS.crates).find(([, position]) => nearbyStation(world, position));
  return crate ? pickUp(world, crate[0]) : false;
}

function advanceStations(world, input, delta) {
  if (world.boardItem && input.interact && nearbyStation(world, STATIONS.board)) {
    world.boardProgress = Math.min(TIMING.chop, world.boardProgress + delta);
  }
  if (world.wokItem) {
    world.wokProgress += delta;
    if (world.wokProgress >= TIMING.cook + TIMING.burn && !world.wokItem.burnt) {
      world.wokItem.burnt = true;
      emitEvent(world, EVENT.BURN, { item: world.wokItem.id });
      floatText(world, 'BURNED! TRASH IT', STATIONS.wok.x, STATIONS.wok.y - 56, '#ff6758');
    }
  }
}

export function update(world, input = EMPTY_INPUT, delta = 1 / 60) {
  if (world.over) return;
  const elapsed = Math.max(0, Math.min(delta, 0.05));
  world.time += elapsed;
  world.remaining = Math.max(0, SHIFT_LENGTH - world.time);
  world.player.moving = runPlayer(world, input, elapsed);
  advanceStations(world, input, elapsed);
  if (input.interactPressed) stationAction(world);
  expireOrders(world);

  if (!world.rush && world.remaining <= 30) {
    world.rush = true;
    emitEvent(world, EVENT.RUSH);
  }
  if (world.orders.length < TIMING.maxOrders && world.remaining > 0 && world.time >= world.spawnAt) {
    spawnOrder(world);
    world.spawnAt = world.time + (world.remaining <= 30 ? TIMING.rushSpawn : world.remaining <= 75 ? TIMING.lateSpawn : TIMING.spawn);
  }
  for (const item of world.floating) { item.life -= elapsed; item.y -= elapsed * 25; }
  world.floating = world.floating.filter((item) => item.life > 0);
  for (const message of world.messages) message.life -= elapsed;
  world.messages = world.messages.filter((message) => message.life > 0);
  world.serveWindowReady = Boolean(world.player.carried?.type === 'plate' && matchingPlateRecipe(world.player.carried));
  if (world.remaining <= 0) {
    world.over = true;
    world.orders.length = 0;
  }
}

export function getNeeds(world) {
  if (!world.orders.length) return [];
  const order = [...world.orders].sort((first, second) => first.remaining - second.remaining)[0];
  const remaining = [...order.recipe.components];
  for (const item of world.plate.items) {
    const match = remaining.findIndex((component) => component.id === item.id && component.prep.length === item.prepped.length && component.prep.every((step) => item.prepped.includes(step)));
    if (match !== -1) remaining.splice(match, 1);
  }
  return remaining.map((component) => component.id);
}

export function targetForCarried(world) {
  const item = world.player.carried;
  if (!item) return null;
  if (item.type === 'plate') return STATIONS.serve;
  const step = nextPreparation(item);
  if (step === 'chop') return STATIONS.board;
  if (step === 'cook') return STATIONS.wok;
  return STATIONS.plate;
}
