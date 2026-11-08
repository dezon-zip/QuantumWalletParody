const CHAR_DELAY = 42;
const GLITCH_DELAY = 70;
const LINE_GAP = 160;

/** Redraws the cursor as a random pattern of up to 4 cells in a 3x3 grid. */
function glitch(cursor) {
  cursor.replaceChildren();
  const used = new Set();

  for (let k = 0; k < 4; k++) {
    const cell = Math.floor(Math.random() * 9);
    if (used.has(cell)) continue;
    used.add(cell);

    const block = document.createElement('i');
    block.style.left = `${(cell % 3) * 0.33}em`;
    block.style.top = `${Math.floor(cell / 3) * 0.33}em`;
    cursor.appendChild(block);
  }
}

/**
 * Types out the hero headline line by line with a glitching block cursor.
 * Each line's final text lives in its hidden `.gh` span (which also reserves the width).
 */
export function typeHeadline(lines, { instant = false } = {}) {
  let index = 0;

  for (const line of lines) line.querySelector('.ty').textContent = '';

  function typeNext() {
    if (index >= lines.length) return;

    const line = lines[index++];
    const isLast = index === lines.length;
    const target = line.querySelector('.ty');
    const fullText = line.querySelector('.gh').textContent;

    const text = document.createTextNode('');
    const cursor = document.createElement('span');
    cursor.className = 'blk';
    target.replaceChildren(text, cursor);

    const glitchTimer = setInterval(() => glitch(cursor), GLITCH_DELAY);
    let count = 0;

    const typeTimer = setInterval(
      () => {
        count++;
        text.data = fullText.slice(0, count);
        if (count < fullText.length) return;

        clearInterval(typeTimer);
        setTimeout(
          () => {
            clearInterval(glitchTimer);
            cursor.remove();
          },
          isLast ? 500 : 140
        );
        setTimeout(typeNext, LINE_GAP);
      },
      instant ? 1 : CHAR_DELAY
    );
  }

  typeNext();
}
