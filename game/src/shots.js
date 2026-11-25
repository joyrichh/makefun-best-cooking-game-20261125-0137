import { INGREDIENTS, RECIPES, STATIONS, TIMING } from './config.js';
import { addToPlate, createWorld, pickUp, popEvents, servePlate, startChop, startCook, update, } from './world.js';

const NO_INPUT = { up: false, down: false, left: false, right: false, interact: false, interactPressed: false, click: null };

function moveAutopilotTo(world, station) {
  const isCrate = Object.values(STATIONS.crates).includes(station);
  world.player.target = isCrate
    ? { x: station.x + 58, y: station.y - 23 }
    : { x: station.x - (station === STATIONS.serve ? 37 : 47), y: station.y + (station === STATIONS.serve ? 55 : 52) };
  for (let step = 0; step < 160 && world.player.target; step++) update(world, NO_INPUT, 0.05);
}

function runWork(world) {
  const recipe = RECIPES[0];
  const order = world.orders.find((ticket) => ticket.recipe.id === recipe.id) ?? world.orders[0];
  for (const component of order.recipe.components) {
    moveAutopilotTo(world, STATIONS.crates[component.id]);
    if (!pickUp(world, component.id)) return false;

    if (component.prep.includes('chop')) {
      moveAutopilotTo(world, STATIONS.board);
      if (!startChop(world)) return false;
      for (let step = 0; step < 25; step++) update(world, { ...NO_INPUT, interact: true }, 0.05);
      update(world, { ...NO_INPUT, interactPressed: true }, 1 / 60);
    }

    if (component.prep.includes('cook')) {
      moveAutopilotTo(world, STATIONS.wok);
      if (!startCook(world)) return false;
      for (let step = 0; step < Math.ceil(TIMING.cook / 0.05); step++) update(world, NO_INPUT, 0.05);
      update(world, { ...NO_INPUT, interactPressed: true }, 1 / 60);
    }

    moveAutopilotTo(world, STATIONS.plate);
    if (!addToPlate(world)) return false;
    popEvents(world);
  }

  moveAutopilotTo(world, STATIONS.plate);
  if (!addToPlate(world)) return false;
  moveAutopilotTo(world, STATIONS.serve);
  return servePlate(world);
}

function addTicket(world, index, remaining) {
  const order = { id: world.nextOrder++, recipe: RECIPES[index], remaining, patience: RECIPES[index].patience ?? 68, serial: world.nextOrder };
  world.orders.push(order);
  return order;
}

function stageCover(world) {
  world.time = 88;
  world.remaining = 92;
  world.rush = false;
  world.coins = Math.max(135, world.coins + 90);
  world.orders = [];
  addTicket(world, 0, 48);
  addTicket(world, 1, 57);
  addTicket(world, 2, 37);
  world.plate = {
    items: [
      { id: 'mie', prepped: ['cook'] },
      { id: 'ayam', prepped: ['chop'], burnt: false },
    ],
  };
  world.plate.items[1].prepped.push('cook');
  world.player.carried = {
    type: 'plate', x: STATIONS.serve.x, y: STATIONS.serve.y,
    items: [{ id: 'nasi', prepped: ['cook'] }, { id: 'telur', prepped: ['cook'] }, { id: 'cabai', prepped: ['chop'] }],
  };
  world.player.x = 1090;
  world.player.y = 478;
  world.player.target = null;
  world.wokItem = { id: 'ayam', prepped: ['chop'], burnt: false };
  world.wokProgress = 2.65;
  world.boardItem = { id: 'sayur', prepped: [], burnt: false };
  world.boardProgress = 0.77;
  world.floating = [
    { text: 'NEED ONE MORE: SAYUR', x: 592, y: 520, life: 1.35, color: '#ffdf93' },
  ];
  world.serveWindowReady = true;
  world.spawnAt = 93;
}

function stageTitle(world) {
  world.time = 6;
  world.remaining = 174;
  world.coins = 84;
  addTicket(world, 1, 61);
  addTicket(world, 4, 31);
  world.plate.items.push({ id: 'mie', prepped: ['cook'] });
  world.wokItem = { id: 'ayam', prepped: ['chop'], burnt: false };
  world.wokProgress = 2.1;
  world.boardItem = { id: 'cabai', prepped: [], burnt: false };
  world.boardProgress = 0.42;
  world.player.x = 434;
  world.player.y = 562;
}

function stageRush(world) {
  world.time = 166;
  world.remaining = 14;
  world.rush = true;
  world.coins = 372;
  world.served = 7;
  world.combo = 2;
  world.bestCombo = 5;
  const timings = [7, 10, 5, 12];
  [0, 1, 2, 4].forEach((recipe, index) => addTicket(world, recipe, timings[index]));
  world.plate.items = [
    { id: 'sayur', prepped: ['chop'] },
    { id: 'ayam', prepped: ['chop'] },
  ];
  world.wokItem = { id: 'nasi', prepped: [], burnt: false };
  world.wokProgress = 3.31;
  world.boardItem = { id: 'cabai', prepped: [], burnt: false };
  world.boardProgress = 1.05;
  world.player.x = 447;
  world.player.y = 556;
}

function stageServe(world) {
  world.time = 180;
  world.remaining = 0;
  world.rush = true;
  world.over = true;
  world.coins = 534;
  world.served = 11;
  world.bestCombo = 7;
  world.combo = 0;
  world.orders = [];
  world.plate.items = [
    { id: 'ayam', prepped: ['chop', 'cook'] },
    { id: 'cabai', prepped: ['chop'] },
  ];
}

export function stageShot(name, seed = 7) {
  const world = createWorld(seed);
  world.spawnAt = 180;
  world.player.x = 347;
  world.player.y = 547;
  if (name === 'title') {
    stageTitle(world);
    return { screen: 'title', world, best: world.bestCombo };
  }

  world.orders = [{ id: world.nextOrder++, recipe: RECIPES[0], remaining: 67, patience: 68, serial: world.nextOrder }];
  if (!runWork(world)) return { screen: 'play', world, best: world.bestCombo };

  if (name === 'cover') stageCover(world);
  else if (name === 'rush') stageRush(world);
  else if (name === 'serve') stageServe(world);
  else stageCover(world);
  return { screen: name === 'serve' ? 'over' : 'play', world, best: world.bestCombo };
}

export function getShotIngredients(world) {
  return Object.values(INGREDIENTS).map(({ id }) => world.player.carried?.id === id);
}
