const pressedKeys = new Set();
const keyPressedThisFrame = new Set();
const CLICK_RADIUS = 61;

export function createInput(canvas) {
  const clicks = [];
  let pointer = null;

  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key)) event.preventDefault();
    const key = event.key.toLowerCase();
    if (!pressedKeys.has(key)) keyPressedThisFrame.add(key);
    pressedKeys.add(key);
  });
  window.addEventListener('keyup', (event) => pressedKeys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => pressedKeys.clear());
  canvas.addEventListener('pointermove', (event) => { pointer = canvasPoint(canvas, event); });
  canvas.addEventListener('pointerdown', (event) => {
    canvas.focus();
    pointer = canvasPoint(canvas, event);
    clicks.push({ x: pointer.x, y: pointer.y });
  });

  return {
    read() {
      const state = {
        up: pressedKeys.has('w') || pressedKeys.has('arrowup'),
        down: pressedKeys.has('s') || pressedKeys.has('arrowdown'),
        left: pressedKeys.has('a') || pressedKeys.has('arrowleft'),
        right: pressedKeys.has('d') || pressedKeys.has('arrowright'),
        interact: pressedKeys.has('e') || pressedKeys.has(' '),
        interactPressed: keyPressedThisFrame.has('e') || keyPressedThisFrame.has(' '),
        pausePressed: keyPressedThisFrame.has('p') || keyPressedThisFrame.has('escape'),
        mutePressed: keyPressedThisFrame.has('m'),
        restartPressed: keyPressedThisFrame.has('r'),
        startPressed: keyPressedThisFrame.has('enter'),
        click: clicks.shift() ?? null,
        pointer,
      };
      keyPressedThisFrame.clear();
      return state;
    },
    clickRadius: CLICK_RADIUS,
  };
}

function canvasPoint(canvas, event) {
  const bounds = canvas.getBoundingClientRect();
  return { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
}
