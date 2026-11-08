import { playBootSound } from './sound.js';

const UNLOCK_DELAY = 1200; // wait for the intro fade before allowing scroll

/**
 * Intro gate. Scrolling is locked until the visitor boots the stack (with or without sound).
 * Calls `onEnter` once, the first time either button (or the waitlist link) is used.
 */
export function createIntro(introEl, { onEnter }) {
  let entered = false;
  const root = document.documentElement;
  root.style.overflow = 'hidden';

  function enter({ sound }) {
    if (entered) return;
    entered = true;

    if (sound) playBootSound();
    introEl.classList.add('gone');
    setTimeout(() => {
      root.style.overflow = '';
    }, UNLOCK_DELAY);
    onEnter();
  }

  introEl.querySelector('#power').addEventListener('click', () => enter({ sound: true }));
  introEl.querySelector('#nosound').addEventListener('click', () => enter({ sound: false }));

  return {
    enter,
    get entered() {
      return entered;
    },
  };
}
