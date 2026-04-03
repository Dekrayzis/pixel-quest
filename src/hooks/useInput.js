import { useEffect, useRef, useCallback } from 'react';
import CONTROLS from '../config/controls';

/**
 * Tracks which game-actions are currently pressed.
 * Returns a ref (not state) so reads never cause re-renders.
 */
export default function useInput() {
  const keys = useRef({
    left: false,
    right: false,
    jump: false,
    fire: false,
  });

  // Track raw keys so we can detect fresh presses vs held.
  // jump uses a timestamp buffer so it works even if pressed slightly before landing.
  const justPressed = useRef({
    jump: 0,   // timestamp of last press (0 = not pressed)
    fire: false,
  });
  const JUMP_BUFFER_MS = 150; // buffer window for jump input

  const isAction = useCallback((key, action) => {
    return CONTROLS[action].includes(key);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (isAction(e.key, 'LEFT'))  keys.current.left = true;
      if (isAction(e.key, 'RIGHT')) keys.current.right = true;
      if (isAction(e.key, 'JUMP')) {
        if (!keys.current.jump) justPressed.current.jump = performance.now();
        keys.current.jump = true;
      }
      if (isAction(e.key, 'FIRE')) {
        if (!keys.current.fire) justPressed.current.fire = true;
        keys.current.fire = true;
      }
      // Prevent default for game keys to stop page scrolling
      if ([...CONTROLS.LEFT, ...CONTROLS.RIGHT, ...CONTROLS.JUMP, ...CONTROLS.FIRE].includes(e.key)) {
        e.preventDefault();
      }
    };

    const onUp = (e) => {
      if (isAction(e.key, 'LEFT'))  keys.current.left = false;
      if (isAction(e.key, 'RIGHT')) keys.current.right = false;
      if (isAction(e.key, 'JUMP'))  keys.current.jump = false;
      if (isAction(e.key, 'FIRE'))  keys.current.fire = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [isAction]);

  /**
   * Consume a "just pressed" flag (returns true once per press).
   * For jump, uses a time-buffered approach: returns true if pressed within JUMP_BUFFER_MS.
   */
  const consumeJustPressed = useCallback((action) => {
    if (action === 'jump') {
      const pressTime = justPressed.current.jump;
      if (pressTime && performance.now() - pressTime < JUMP_BUFFER_MS) {
        justPressed.current.jump = 0;
        return true;
      }
      return false;
    }
    if (justPressed.current[action]) {
      justPressed.current[action] = false;
      return true;
    }
    return false;
  }, []);

  return { keys, consumeJustPressed };
}
