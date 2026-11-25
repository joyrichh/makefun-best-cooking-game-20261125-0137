import { HEIGHT, INGREDIENTS, RECIPES, SHIFT_LENGTH, STATIONS, TIMING, WIDTH } from './config.js';
import { matchingPlateRecipe } from './world.js';

const COLOR = {
  wall: '#164447', wallShade: '#10383b', floor: '#d1a26a', floorLight: '#ddbb81', floorDark: '#c4925b',
  wood: '#985b38', woodLight: '#b57448', woodDark: '#6d402e', cream: '#fff0cb', ink: '#193a36',
  mint: '#a6d490', red: '#e55b4f', yellow: '#ffd27b', brass: '#e1b65e', plate: '#f2e3c5',
};
const SEEDED_FLOOR = Array.from({ length: 96 }, (_, index) => ((index * 67 + Math.floor(index / 11) * 29) % 83) / 83);
const animatedLantern = { pulse: 0.36 };

export function drawKitchen(context, world) {
  context.save();
  context.fillStyle = COLOR.wall;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  drawWallDetails(context);
  drawFloor(context);
  drawLantern(context, world);
  drawCrates(context, world);
  drawWorkstations(context, world);
  drawOrderBoard(context, world);
  drawPlate(context, world);
  drawCookware(context, world);
  drawTrash(context);
  drawServingWindow(context, world);
  drawChef(context, world);
  drawFloatingTexts(context, world);
  if (world.rush && !world.over) drawRushVignette(context, world);
  context.restore();
}

function roundedRect(context, x, y, width, height, radius, fill, stroke, lineWidth = 2) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (fill) { context.fillStyle = fill; context.fill(); }
  if (stroke) { context.lineWidth = lineWidth; context.strokeStyle = stroke; context.stroke(); }
}

function drawWallDetails(context) {
  context.fillStyle = COLOR.wallShade;
  context.fillRect(0, 0, WIDTH, 208);
  context.fillStyle = 'rgba(230,198,137,.075)';
  for (let x = 29; x < WIDTH; x += 100) context.fillRect(x, 26, 2, 126);
  context.fillStyle = 'rgba(243,204,128,.1)';
  context.fillRect(0, 199, WIDTH, 9);
  roundedRect(context, 361, 63, 482, 47, 18, 'rgba(255,220,154,.08)', 'rgba(255,238,196,.12)', 1);
  context.font = '800 21px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillStyle = 'rgba(255,239,205,.45)';
  context.fillText('KEDAI   •   DAPUR MALAM   •   OPEN LATE', 602, 93);
}

function drawFloor(context) {
  context.fillStyle = COLOR.floor;
  context.fillRect(0, 207, WIDTH, HEIGHT - 207);
  const tileWidth = 160;
  const tileHeight = 88;
  for (let row = 0; row < 7; row++) {
    for (let column = 0; column < 8; column++) {
      const x = column * tileWidth - 1;
      const y = 207 + row * tileHeight;
      context.fillStyle = (row + column) % 2 ? COLOR.floor : COLOR.floorLight;
      context.fillRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2);
      const seed = SEEDED_FLOOR[row * 8 + column];
      if (seed > 0.79) {
        context.strokeStyle = 'rgba(117,75,48,.075)';
        context.lineWidth = 3;
        context.beginPath();
        context.ellipse(x + 73, y + 48, 12, 4, seed, 0, Math.PI * 2);
        context.stroke();
      }
    }
  }
}

function drawLantern(context, world) {
  const time = world.time || 0;
  const glow = 24 + Math.sin(time * 2.2) * 4;
  const gradient = context.createRadialGradient(694, 174, 16, 694, 174, 188);
  gradient.addColorStop(0, `rgba(255,190,99,${0.13 + Math.sin(time * 3) * 0.025})`);
  gradient.addColorStop(1, 'rgba(255,174,89,0)');
  context.fillStyle = gradient;
  context.fillRect(470, 4, 450, 373);
  context.fillStyle = '#ecc072';
  context.fillRect(690, 118, 8, 43);
  context.beginPath();
  context.ellipse(694, 169, 32, glow, 0, 0, Math.PI * 2);
  context.fillStyle = '#ffd891';
  context.fill();
  context.beginPath();
  context.ellipse(694, 174, 12, 8, 0, 0, Math.PI * 2);
  context.fillStyle = '#fff3cb';
  context.fill();
}

function drawCrates(context, world) {
  context.font = '700 14px system-ui, sans-serif';
  for (const [id, crate] of Object.entries(STATIONS.crates)) {
    const x = crate.x - 44;
    const y = crate.y - 43;
    roundedRect(context, x, y, 87, 88, 13, '#744633', '#4f3529', 4);
    roundedRect(context, x + 5, y + 6, 77, 61, 9, '#b67a50', 'rgba(255,231,181,.27)', 2);
    context.fillStyle = 'rgba(74,42,29,.29)';
    context.fillRect(x + 12, y + 12, 63, 3);
    context.fillRect(x + 12, y + 55, 63, 4);
    drawIngredientIcon(context, crate.icon, crate.x, crate.y - 3, 22, 0);
    roundedRect(context, x + 5, y + 68, 77, 17, 5, '#f3dbab', null);
    context.fillStyle = COLOR.ink;
    context.textAlign = 'center';
    context.fillText(crate.name, crate.x, y + 81);
    if (world.player.carried?.id === id) {
      context.beginPath();
      context.arc(crate.x + 35, crate.y - 35, 7, 0, Math.PI * 2);
      context.fillStyle = '#9fed9c';
      context.fill();
    }
  }
}

function drawWorkstations(context, world) {
  drawWoodCounter(context, STATIONS.board.x - 100, STATIONS.board.y - 31, 200, 120, 'BOARD & CLEAVER');
  roundedRect(context, STATIONS.board.x - 75, STATIONS.board.y - 6, 147, 56, 12, '#d8ab70', '#845a3e', 4);
  context.fillStyle = 'rgba(111,72,45,.18)';
  context.fillRect(STATIONS.board.x - 57, STATIONS.board.y + 4, 109, 3);
  drawProgress(context, STATIONS.board.x + 42, STATIONS.board.y + 5, Math.min(1, world.boardProgress / TIMING.chop), '#a5df87', world.boardItem ? `${Math.min(100, Math.round(world.boardProgress / TIMING.chop * 100))}%` : '');

  drawWoodCounter(context, STATIONS.wok.x - 101, STATIONS.wok.y - 30, 206, 121, 'WOK   •   LIVE FLAME');
  context.beginPath();
  context.ellipse(STATIONS.wok.x, STATIONS.wok.y + 16, 57, 34, 0, 0, Math.PI * 2);
  context.fillStyle = '#343d3a';
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = '#e5bf80';
  context.stroke();
  context.beginPath();
  context.ellipse(STATIONS.wok.x, STATIONS.wok.y + 12, 43, 23, 0, 0, Math.PI * 2);
  context.fillStyle = '#182f30';
  context.fill();
  if (world.wokItem) {
    drawIngredientIcon(context, INGREDIENTS[world.wokItem.id].icon, STATIONS.wok.x, STATIONS.wok.y + 11, 23, world.wokItem.burnt ? 1 : 0);
    const amount = Math.min(1, world.wokProgress / (TIMING.cook + TIMING.burn));
    drawProgress(context, STATIONS.wok.x + 74, STATIONS.wok.y + 4, amount, world.wokItem.burnt ? COLOR.red : '#ffbe68', world.wokItem.burnt ? 'BURN' : `${Math.round(world.wokProgress)}s`);
  }

  drawWoodCounter(context, STATIONS.plate.x - 111, STATIONS.plate.y - 40, 226, 119, 'PASS & PLATING');
  drawWoodCounter(context, STATIONS.serve.x - 63, STATIONS.serve.y - 91, 129, 219, 'SERVE');
  drawTrash(context);
}

function drawWoodCounter(context, x, y, width, height, label) {
  roundedRect(context, x + 5, y + 9, width, height, 13, 'rgba(57,36,29,.34)', null);
  roundedRect(context, x, y, width, height, 13, COLOR.wood, '#653f30', 4);
  roundedRect(context, x + 5, y + 5, width - 10, Math.min(height - 10, 35), 8, COLOR.woodLight, 'rgba(255,225,175,.17)', 2);
  context.fillStyle = 'rgba(73,48,35,.37)';
  for (let plank = 0; plank < 3; plank++) context.fillRect(x + 8, y + 43 + plank * 21, width - 16, 2);
  roundedRect(context, x + 8, y + height - 28, width - 16, 21, 7, '#f5dfb2', null);
  context.textAlign = 'center';
  context.fillStyle = '#563b2c';
  context.font = '800 11px system-ui, sans-serif';
  context.fillText(label, x + width / 2, y + height - 13);
}

function drawOrderBoard(context, world) {
  roundedRect(context, 296, 13, 664, 167, 20, '#573b30', '#3b2c29', 4);
  roundedRect(context, 303, 19, 650, 153, 14, '#ebd2a4', '#fff0cb', 3);
  roundedRect(context, 315, 25, 244, 32, 8, '#1e504d', null);
  context.textAlign = 'left';
  context.fillStyle = '#fff2cf';
  context.font = '900 18px system-ui, sans-serif';
  context.fillText('✦   ORDER BOARD', 328, 47);
  context.font = '700 12px system-ui, sans-serif';
  context.fillStyle = '#655143';
  context.textAlign = 'right';
  context.fillText('COOK IT • PLATE IT • SEND IT HOT', 940, 44);
  context.textAlign = 'left';
  const orders = world.orders;
  const gap = 12;
  const cardWidth = orders.length <= 3 ? 204 : 150;
  for (let index = 0; index < orders.length; index++) {
    const order = orders[index];
    const x = 316 + index * (cardWidth + gap);
    const y = 65;
    const low = order.remaining < order.patience * 0.32;
    const ratio = Math.max(0, order.remaining / order.patience);
    roundedRect(context, x, y, cardWidth, 91, 11, low ? '#fff0e5' : '#fff8e9', low ? '#e98770' : '#ddc495', 2);
    context.fillStyle = '#253f38';
    context.font = '850 17px system-ui, sans-serif';
    context.textAlign = 'left';
    context.fillText(order.recipe.name, x + 12, y + 23, cardWidth - 24);
    context.textAlign = 'right';
    context.fillStyle = '#855d39';
    context.font = '800 13px system-ui, sans-serif';
    context.fillText(`${order.recipe.price}¢`, x + cardWidth - 13, y + 44);
    const iconWidth = (cardWidth - 30) / Math.max(1, order.recipe.components.length);
    order.recipe.components.forEach((component, slot) => {
      const ingredient = INGREDIENTS[component.id];
      const center = x + 24 + slot * iconWidth + iconWidth / 2;
      drawIngredientIcon(context, ingredient.icon, center, y + 48, 12, 0);
      context.textAlign = 'center';
      context.fillStyle = '#55463c';
      context.font = '700 10px system-ui, sans-serif';
      context.fillText(ingredient.name.toUpperCase(), center, y + 70);
      context.fillStyle = '#718378';
      context.font = '700 8px system-ui, sans-serif';
      context.fillText(component.prep.map((prep) => prep === 'cook' ? 'WOK' : 'CHOP').join(' + '), center, y + 82);
    });
    roundedRect(context, x + 11, y + 83, cardWidth - 22, 5, 3, '#dccbb1', null);
    roundedRect(context, x + 11, y + 83, (cardWidth - 22) * ratio, 5, 3, low ? '#e6574b' : '#75a975', null);
  }
  if (!orders.length) {
    context.textAlign = 'center';
    context.fillStyle = '#7b6751';
    context.font = '700 16px system-ui, sans-serif';
    context.fillText('Tickets slide in here. First table, first dish!', 628, 114);
  }
}

export function drawPlate(context, world) {
  const centerX = STATIONS.plate.x;
  const centerY = STATIONS.plate.y + 16;
  drawDish(context, centerX, centerY, world.plate.items);
  if (!world.plate.items.length) {
    context.textAlign = 'center';
    context.font = '700 12px system-ui, sans-serif';
    context.fillStyle = '#826847';
    context.fillText('EMPTY PLATE', centerX, centerY + 35);
  }
  for (const station of [STATIONS.board, STATIONS.wok]) {
    const item = station === STATIONS.board ? world.boardItem : world.wokItem;
    if (!item) continue;
    const stationLabel = item.burnt ? 'BURNT — TRASH' : `${INGREDIENTS[item.id].name.toUpperCase()} ${item.prepped.map((step) => step.toUpperCase()).join(' + ')}`;
    context.textAlign = 'center';
    context.font = '700 10px system-ui, sans-serif';
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(27,43,36,.85)';
    context.strokeText(stationLabel, station.x, station.y - 58);
    context.fillStyle = item.burnt ? '#ff9d8a' : '#ffe7be';
    context.fillText(stationLabel, station.x, station.y - 58);
  }
}

function drawDish(context, x, y, items) {
  context.beginPath();
  context.ellipse(x, y + 5, 75, 35, 0, 0, Math.PI * 2);
  context.fillStyle = 'rgba(68,40,31,.22)';
  context.fill();
  context.beginPath();
  context.ellipse(x, y, 75, 37, 0, 0, Math.PI * 2);
  context.fillStyle = COLOR.plate;
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = '#ceb484';
  context.stroke();
  context.beginPath();
  context.ellipse(x, y, 62, 27, 0, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(175,140,95,.55)';
  context.lineWidth = 1.5;
  context.stroke();
  const positions = items.length <= 2 ? [{ x: -23, y: 0 }, { x: 23, y: 0 }] : [{ x: -37, y: -3 }, { x: 0, y: -6 }, { x: 36, y: -2 }, { x: 0, y: 12 }];
  items.slice(0, 4).forEach((item, index) => {
    const position = positions[index];
    drawIngredientIcon(context, INGREDIENTS[item.id].icon, x + position.x, y + position.y, 14, item.burnt ? 1 : 0);
  });
  if (items.length) {
    context.textAlign = 'center';
    context.fillStyle = '#5d4b39';
    context.font = '700 9px system-ui, sans-serif';
    context.fillText(`${items.length} / 4`, x, y + 47);
  }
}

function drawCookware(context, world) {
  if (world.player.carried?.type === 'plate') return;
}

export function drawChef(context, world) {
  const player = world.player;
  const x = player.x;
  const y = player.y + Math.sin(world.time * 8) * (player.moving ? 2 : 0.6);
  context.beginPath();
  context.ellipse(x, y + 12, 29, 10, 0, 0, Math.PI * 2);
  context.fillStyle = 'rgba(44,45,37,.22)';
  context.fill();
  context.fillStyle = '#3a524c';
  context.fillRect(x - 17, y - 8, 34, 38);
  roundedRect(context, x - 19, y - 7, 38, 33, 10, '#faf2dd', '#cec3a9', 2);
  context.fillStyle = '#d7e6d3';
  context.beginPath();
  context.moveTo(x, y - 4);
  context.lineTo(x + player.facing * 11, y + 22);
  context.lineTo(x - player.facing * 5, y + 22);
  context.closePath();
  context.fill();
  context.beginPath();
  context.arc(x, y - 20, 20, Math.PI, 0);
  context.lineTo(x + 17, y - 13);
  context.lineTo(x - 17, y - 13);
  context.closePath();
  context.fillStyle = '#38403a';
  context.fill();
  context.beginPath();
  context.ellipse(x, y - 30, 24, 8, 0, 0, Math.PI * 2);
  context.fillStyle = '#fff5df';
  context.fill();
  roundedRect(context, x - 15, y - 48, 30, 19, 8, '#fff5df', '#d8ccb5', 2);
  context.beginPath();
  context.arc(x + player.facing * 7, y - 19, 2, 0, Math.PI * 2);
  context.fillStyle = '#302f2a';
  context.fill();
  if (player.carried) drawCarriedFood(context, player);
}

function drawCarriedFood(context, player) {
  const x = player.x;
  const y = player.y - 77;
  if (player.carried.type === 'plate') {
    drawDish(context, x, y, player.carried.items);
    const recipe = matchingPlateRecipe(player.carried);
    if (recipe) {
      context.fillStyle = '#fff2c8';
      context.font = '800 10px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(recipe.name, x, y - 42);
    }
    return;
  }
  drawIngredientIcon(context, INGREDIENTS[player.carried.id].icon, x, y, 17, player.carried.burnt ? 1 : 0);
  context.font = '800 10px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillStyle = '#fff4db';
  context.fillText(player.carried.burnt ? 'BURNT!' : INGREDIENTS[player.carried.id].name, x, y - 23);
}

function drawIngredientIcon(context, icon, x, y, size = 18, charred = 0) {
  context.save();
  context.translate(x, y);
  context.fillStyle = charred ? '#282521' : '#f1dcad';
  context.strokeStyle = charred ? '#171a18' : '#70523a';
  context.lineWidth = Math.max(1.5, size * 0.11);
  if (charred) {
    context.beginPath();
    context.ellipse(0, 0, size * 0.81, size * 0.56, -0.22, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }
  if (icon === 'rice') {
    context.beginPath();
    context.ellipse(0, 4, size * 0.82, size * 0.43, 0, 0, Math.PI * 2);
    context.fill(); context.stroke();
    context.beginPath();
    context.ellipse(0, -1, size * 0.68, size * 0.43, 0, Math.PI, 0);
    context.fillStyle = '#fff3d5'; context.fill(); context.stroke();
    for (const offset of [-0.39, -0.08, 0.26]) {
      context.beginPath(); context.ellipse(size * offset, 4, size * 0.1, size * 0.19, offset, 0, Math.PI * 2); context.fillStyle = '#dfbd85'; context.fill();
    }
  } else if (icon === 'noodles') {
    for (let loop = 0; loop < 4; loop++) {
      context.beginPath();
      context.ellipse(0, -2 + loop * 1.8, size * (0.36 + loop * 0.13), size * (0.25 + loop * 0.09), 0, 0.15, Math.PI * (1.8 + loop * 0.13));
      context.strokeStyle = ['#c79249', '#dfaa54', '#f3cf78', '#fff0b0'][loop];
      context.lineWidth = Math.max(2, size * 0.13);
      context.stroke();
    }
  } else if (icon === 'chicken') {
    context.rotate(-0.57);
    roundedRect(context, -size * 0.43, -size * 0.34, size * 0.87, size * 0.66, size * 0.3, '#cf7648', '#885035', Math.max(1.6, size * 0.09));
    context.beginPath(); context.moveTo(size * 0.25, size * 0.15); context.lineTo(size * 0.63, size * 0.5); context.strokeStyle = '#f5edcd'; context.lineWidth = size * 0.18; context.lineCap = 'round'; context.stroke();
    context.beginPath(); context.arc(size * 0.7, size * 0.57, size * 0.14, 0, Math.PI * 2); context.fillStyle = '#fbf2d5'; context.fill();
  } else if (icon === 'egg') {
    context.beginPath(); context.ellipse(0, 0, size * 0.63, size * 0.83, -0.19, 0, Math.PI * 2); context.fillStyle = '#fff8e9'; context.fill(); context.stroke();
    context.beginPath(); context.arc(size * 0.12, size * 0.14, size * 0.25, 0, Math.PI * 2); context.fillStyle = '#e8b34c'; context.fill();
  } else if (icon === 'chili') {
    context.save(); context.rotate(-0.48);
    context.beginPath(); context.moveTo(-size * 0.76, -size * 0.12); context.quadraticCurveTo(0, -size * 0.71, size * 0.78, -size * 0.12); context.quadraticCurveTo(size * 0.34, size * 0.32, -size * 0.82, size * 0.13); context.closePath(); context.fillStyle = '#dc493c'; context.fill(); context.stroke();
    context.beginPath(); context.moveTo(-size * 0.72, -size * 0.13); context.lineTo(-size * 0.96, -size * 0.35); context.strokeStyle = '#527849'; context.lineWidth = size * 0.22; context.stroke();
    context.restore();
  } else if (icon === 'greens') {
    for (let leaf = 0; leaf < 5; leaf++) {
      context.save(); context.rotate((leaf - 2) * 0.43);
      context.beginPath(); context.ellipse(0, -size * 0.23, size * 0.28, size * 0.63, 0, 0, Math.PI * 2); context.fillStyle = ['#5a9b57', '#75ad59', '#3f8350', '#8eb861', '#50814d'][leaf]; context.fill(); context.stroke();
      context.beginPath(); context.moveTo(0, -size * 0.65); context.lineTo(0, size * 0.12); context.strokeStyle = '#d6dc9a'; context.lineWidth = 1.4; context.stroke();
      context.restore();
    }
  }
  context.restore();
}

function drawProgress(context, x, y, fraction, color, label) {
  const radius = 16;
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.lineWidth = 4; context.strokeStyle = 'rgba(30,40,35,.58)'; context.stroke();
  if (fraction > 0) {
    context.beginPath(); context.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction); context.lineWidth = 4; context.strokeStyle = color; context.lineCap = 'round'; context.stroke();
  }
  if (label) {
    context.textAlign = 'center'; context.fillStyle = '#fff1ce'; context.font = '800 9px system-ui, sans-serif'; context.fillText(label, x, y + 30);
  }
}

function drawTrash(context) {
  const station = STATIONS.trash;
  const x = station.x - 36;
  const y = station.y - 34;
  roundedRect(context, x, y + 8, 72, 53, 12, '#526665', '#364846', 3);
  roundedRect(context, x - 5, y + 2, 82, 15, 6, '#8da093', '#3e514d', 2);
  context.fillStyle = '#d7b783';
  context.font = '900 11px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText('BIN', station.x, y + 39);
  context.fillStyle = 'rgba(35,58,53,.83)';
  context.fillRect(station.x - 27, y + 72, 54, 18);
  context.fillStyle = '#f5dec0';
  context.font = '800 9px system-ui, sans-serif';
  context.fillText('TRASH', station.x, y + 85);
}

function drawServingWindow(context, world) {
  const x = 1050;
  const y = 256;
  roundedRect(context, x, y, 141, 36, 9, '#203c37', '#77513a', 3);
  context.fillStyle = '#ffe1a3';
  context.textAlign = 'center';
  context.font = '900 15px system-ui, sans-serif';
  context.fillText(world.player.carried?.type === 'plate' ? 'DISH READY →' : 'HOT FOOD →', x + 70, y + 24);
  if (world.player.carried?.type !== 'plate') {
    roundedRect(context, 1062, 340, 109, 54, 15, '#ffe8b6', '#8b6139', 3);
    context.fillStyle = '#734b32';
    context.fillRect(1074, 352, 84, 6);
    context.fillStyle = '#9f683d';
    context.font = '900 14px system-ui, sans-serif';
    context.fillText('SERVE HERE', 1117, 378);
  }
  if (world.serveWindowReady) {
    context.beginPath(); context.arc(1161, 346, 8, 0, Math.PI * 2); context.fillStyle = '#73ca7e'; context.fill();
  }
}

export function drawHud(context, world, muted) {
  roundedRect(context, 23, 20, 224, 134, 17, 'rgba(25,57,49,.95)', 'rgba(255,228,182,.33)', 2);
  context.textAlign = 'left';
  context.font = '800 13px system-ui, sans-serif';
  context.fillStyle = '#e2c89a';
  context.fillText('TONIGHT’S TILL', 44, 46);
  context.fillStyle = '#ffe496';
  context.font = '900 34px system-ui, sans-serif';
  context.fillText(`${world.coins}¢`, 42, 82);
  context.fillStyle = '#f8eacb';
  context.font = '700 13px system-ui, sans-serif';
  context.fillText(`PLATES   ${world.served}`, 43, 112);
  context.fillStyle = '#f8eacb';
  context.fillText(`STREAK   ×${world.combo}`, 43, 135);

  const timerLeft = 988;
  const timerColor = world.remaining <= 30 ? COLOR.red : '#214a41';
  roundedRect(context, timerLeft, 19, 264, 84, 16, timerColor, world.remaining <= 30 ? '#ffb39d' : 'rgba(255,228,182,.37)', 2);
  context.textAlign = 'center';
  context.fillStyle = '#f5dfbd';
  context.font = '800 12px system-ui, sans-serif';
  context.fillText('TIME LEFT', timerLeft + 132, 43);
  const minutes = Math.floor(world.remaining / 60);
  const seconds = Math.ceil(world.remaining % 60).toString().padStart(2, '0');
  context.fillStyle = world.remaining <= 30 ? '#fff1d4' : '#fff0c9';
  context.font = '900 33px ui-monospace, monospace';
  context.fillText(`${minutes}:${seconds}`, timerLeft + 132, 79);
  context.fillStyle = '#e5d2ac';
  context.font = '700 12px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(`SERVED  ${world.served}     BEST STREAK  ×${world.bestCombo}`, 1120, 140);
  context.textAlign = 'left';
  context.fillText(`M  SOUND ${muted ? 'OFF' : 'ON'}     P / ESC  PAUSE     CLICK ANYWHERE TO MOVE`, 34, 774);
  context.textAlign = 'right';
  context.fillText('E / SPACE: WORK     •     FOLLOW THE RECIPE TICKET', 1246, 774);
  if (world.rush && !world.over) drawRushBanner(context, world);
  for (const message of world.messages) {
    roundedRect(context, 400, 708, 481, 40, 12, 'rgba(93,35,33,.94)', '#f6b398', 2);
    context.fillStyle = '#fff0d2'; context.font = '850 16px system-ui, sans-serif'; context.textAlign = 'center'; context.fillText(message.text, 640, 734);
  }
}

function drawRushBanner(context, world) {
  const pulse = 0.6 + 0.4 * Math.sin(world.time * 8);
  context.save();
  context.translate(640, 222);
  context.rotate(-0.042);
  roundedRect(context, -133, -24, 266, 48, 12, `rgba(148,43,42,${0.81 + pulse * 0.18})`, '#ffc379', 3);
  context.fillStyle = '#fff1ce';
  context.textAlign = 'center';
  context.font = '1000 27px system-ui, sans-serif';
  context.fillText('✦   R U S H !   ✦', 0, 10);
  context.restore();
}

function drawRushVignette(context, world) {
  const strength = 0.035 + (0.045 + Math.sin(world.time * 9) * 0.03) * Math.max(0.25, 1 - world.remaining / 30);
  context.fillStyle = `rgba(169,40,31,${strength})`;
  context.fillRect(0, 190, WIDTH, HEIGHT - 190);
}

function drawFloatingTexts(context, world) {
  for (const item of world.floating) {
    context.globalAlpha = Math.min(1, item.life * 1.7);
    context.textAlign = 'center';
    context.font = '900 17px system-ui, sans-serif';
    context.lineWidth = 4;
    context.strokeStyle = 'rgba(27,43,36,.88)';
    context.strokeText(item.text, item.x, item.y);
    context.fillStyle = item.color;
    context.fillText(item.text, item.x, item.y);
  }
  context.globalAlpha = 1;
}

export function drawTitle(context, world, muted) {
  drawKitchen(context, world);
  drawHud(context, world, muted);
  context.fillStyle = 'rgba(13,32,33,.65)';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  roundedRect(context, 226, 191, 828, 438, 28, 'rgba(28,68,62,.97)', '#e5c27d', 5);
  roundedRect(context, 242, 206, 796, 409, 21, 'rgba(32,78,69,.83)', 'rgba(255,228,176,.18)', 2);
  context.fillStyle = '#ffd689';
  context.textAlign = 'center';
  context.font = '900 20px system-ui, sans-serif';
  context.fillText('KEDAI • OPEN TILL LAST CALL', 640, 267);
  context.fillStyle = '#fff1cf';
  context.font = '1000 71px system-ui, sans-serif';
  context.fillText('KUALI KILAT', 640, 348);
  context.fillStyle = '#ffd27b';
  context.font = '800 24px system-ui, sans-serif';
  context.fillText('MIDNIGHT AT THE WARUNG', 640, 389);
  context.fillStyle = '#f8e8c9';
  context.font = '600 17px system-ui, sans-serif';
  context.fillText('Fetch fresh. Chop & sizzle. Match the ticket. Keep the coins!', 640, 438);
  context.fillText('WASD / ARROWS move   •   E / SPACE interact   •   Click to walk & work', 640, 475);
  context.fillText('Timed wok food burns. Save scraps at the bin. Your shift is 3 minutes.', 640, 508);
  roundedRect(context, 428, 537, 424, 60, 18, '#d38f49', '#ffe4aa', 3);
  context.fillStyle = '#fff5dd';
  context.font = '900 23px system-ui, sans-serif';
  context.fillText('PRESS ENTER  /  CLICK TO START', 640, 576);
}

export function drawPaused(context, world, muted) {
  drawKitchen(context, world);
  drawHud(context, world, muted);
  context.fillStyle = 'rgba(14,30,31,.66)'; context.fillRect(0, 0, WIDTH, HEIGHT);
  roundedRect(context, 390, 277, 500, 221, 26, '#1c514a', '#e5c27d', 4);
  context.textAlign = 'center'; context.fillStyle = '#fff0cf'; context.font = '1000 54px system-ui, sans-serif'; context.fillText('TAKE FIVE', 640, 359);
  context.font = '700 22px system-ui, sans-serif'; context.fillText('PRESS P / ESC TO JUMP BACK IN', 640, 407);
  context.font = '600 17px system-ui, sans-serif'; context.fillStyle = '#e9d3ad'; context.fillText(`${Math.ceil(world.remaining)} seconds still on the clock`, 640, 448);
}

export function drawGameOver(context, world, muted) {
  drawKitchen(context, world);
  drawHud(context, world, muted);
  context.fillStyle = 'rgba(13,31,32,.7)'; context.fillRect(0, 0, WIDTH, HEIGHT);
  roundedRect(context, 331, 176, 619, 493, 28, '#1c5149', '#ecc981', 4);
  context.textAlign = 'center';
  context.fillStyle = '#f0c47d';
  context.font = '900 17px system-ui, sans-serif';
  context.fillText('THE WOK IS COOLING DOWN', 640, 226);
  context.fillStyle = '#fff1d1';
  context.font = '1000 48px system-ui, sans-serif';
  context.fillText('SHIFT COMPLETE', 640, 284);
  const stars = world.coins >= 480 ? 3 : world.coins >= 260 ? 2 : world.coins >= 110 ? 1 : 0;
  context.font = '1000 68px system-ui, sans-serif';
  context.fillStyle = '#ffdc86';
  context.fillText(stars ? '★ '.repeat(stars).trim() + ' ☆'.repeat(3 - stars) : '☆ ☆ ☆', 640, 371);
  context.fillStyle = '#ffdf91';
  context.font = '900 44px ui-monospace, monospace';
  context.fillText(`${world.coins}¢`, 640, 449);
  context.fillStyle = '#f5e7c8';
  context.font = '700 19px system-ui, sans-serif';
  context.fillText(`${world.served} dishes served     •     best streak ×${world.bestCombo}`, 640, 493);
  roundedRect(context, 493, 526, 294, 57, 16, '#bc8045', '#ffe6b3', 3);
  context.fillStyle = '#fff0d2';
  context.font = '900 20px system-ui, sans-serif';
  context.fillText('R  /  ENTER  PLAY AGAIN', 640, 563);
  context.font = '650 13px system-ui, sans-serif';
  context.fillStyle = '#d4c39f';
  context.fillText(muted ? 'SOUND OFF' : 'SOUND ON', 640, 628);
}

export function render(context, world, screen, muted) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  if (screen === 'title') drawTitle(context, world, muted);
  else if (screen === 'paused') drawPaused(context, world, muted);
  else if (screen === 'over') drawGameOver(context, world, muted);
  else {
    drawKitchen(context, world);
    drawHud(context, world, muted);
  }
}
