export const WIDTH = 1280;
export const HEIGHT = 800;
export const FIXED_STEP = 1 / 60;
export const SHIFT_LENGTH = 180;
export const PLAYER_SPEED = 250;
export const WALK_BOX = { left: 78, right: 1195, top: 231, bottom: 706 };

export const STATIONS = {
  crates: {
    nasi: { x: 114, y: 339, name: 'NASI', color: '#f2e0b5', icon: 'rice' },
    mie: { x: 250, y: 339, name: 'MIE', color: '#efd276', icon: 'noodles' },
    ayam: { x: 114, y: 443, name: 'AYAM', color: '#d87943', icon: 'chicken' },
    telur: { x: 250, y: 443, name: 'TELUR', color: '#f5f0d9', icon: 'egg' },
    sayur: { x: 114, y: 547, name: 'SAYUR', color: '#66a772', icon: 'greens' },
    cabai: { x: 250, y: 547, name: 'CABAI', color: '#dd5241', icon: 'chili' },
  },
  board: { x: 492, y: 359, width: 160, height: 112, label: 'CHOP / HOLD E' },
  wok: { x: 775, y: 359, width: 166, height: 112, label: 'WOK / TIMED' },
  plate: { x: 592, y: 592, width: 194, height: 107, label: 'PLATE / ASSEMBLE' },
  serve: { x: 1101, y: 400, width: 120, height: 163, label: 'SERVE WINDOW' },
  trash: { x: 1029, y: 608, width: 87, height: 85, label: 'TRASH' },
};

export const INGREDIENTS = {
  nasi: { id: 'nasi', name: 'Nasi', color: '#f2e0b5', icon: 'rice', prep: ['cook'] },
  mie: { id: 'mie', name: 'Mie', color: '#efd276', icon: 'noodles', prep: ['cook'] },
  ayam: { id: 'ayam', name: 'Ayam', color: '#d87943', icon: 'chicken', prep: ['chop', 'cook'] },
  telur: { id: 'telur', name: 'Telur', color: '#f5f0d9', icon: 'egg', prep: ['cook'] },
  sayur: { id: 'sayur', name: 'Sayur', color: '#66a772', icon: 'greens', prep: ['chop'] },
  cabai: { id: 'cabai', name: 'Cabai', color: '#dd5241', icon: 'chili', prep: ['chop'] },
};

export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', price: 48, tip: 26, components: [{ id: 'nasi', prep: ['cook'] }, { id: 'telur', prep: ['cook'] }, { id: 'cabai', prep: ['chop'] }] },
  { id: 'mie-ayam', name: 'Mie Ayam', price: 54, tip: 29, components: [{ id: 'mie', prep: ['cook'] }, { id: 'ayam', prep: ['chop', 'cook'] }, { id: 'sayur', prep: ['chop'] }] },
  { id: 'ayam-geprek', name: 'Ayam Geprek', price: 62, tip: 32, components: [{ id: 'ayam', prep: ['chop', 'cook'] }, { id: 'cabai', prep: ['chop'] }, { id: 'nasi', prep: ['cook'] }] },
  { id: 'capcay', name: 'Capcay', price: 42, tip: 24, components: [{ id: 'sayur', prep: ['chop', 'cook'] }, { id: 'telur', prep: ['cook'] }, { id: 'ayam', prep: ['chop'] }] },
  { id: 'sate-kilat', name: 'Sate Kilat', price: 68, tip: 46, components: [{ id: 'ayam', prep: ['chop', 'cook'] }, { id: 'cabai', prep: ['chop'] }], patience: 38 },
];

export const TIMING = { chop: 1.2, cook: 4, burn: 2.2, spawn: 12, lateSpawn: 7, rushSpawn: 5.5, patience: 68, maxOrders: 4, comboSteps: 3 };
export const SCORING = { expiryPenalty: 15, rushTips: 2, stars: [110, 260, 480] };
