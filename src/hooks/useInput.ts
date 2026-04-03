import { useEffect, useRef, useCallback } from 'react';

/**
 * Centralized input bindings.
 */
const CONTROLS: Record<string, string[]> = {
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  JUMP: ['ArrowUp', 'w', 'W', ' '],
  FIRE: ['f', 'F'],
};

const ALL_GAME_KEYS = [
  ...CONTROLS.LEFT, ...CONTROLS.RIGHT, ...CONTROLS.JUMP, ...CONTROLS.FIRE,
];

export interface GameKeys {
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
}

interface JustPressedState {
  jump: number;
  fire: boolean;
  [key: string]: number | boolean;
}

export interface UseInputReturn {
  keys: React.MutableRefObject<GameKeys>;
  consumeJustPressed: (action: string) => boolean;
}

/**
 * Tracks which game-actions are currently pressed.
 * Returns a ref (not state) so reads never cause re-renders.
 */
export default function useInput(): UseInputReturn {
  const keys = useRef<GameKeys>({
    left: false,
    right: false,
    jump: false,
    fire: false,
  });

  // Track raw keys so we can detect fresh presses vs held.
  // jump uses a timestamp buffer so it works even if pressed slightly before landing.
  const justPressed = useRef<JustPressedState>({
    jump: 0,   // timestamp of last press (0 = not pressed)
    fire: false,
  });
  const JUMP_BUFFER_MS = 150; // buffer window for jump input

  const isAction = useCallback((key: string, action: string): boolean => {
    return CONTROLS[action].includes(key);
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
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
      if (ALL_GAME_KEYS.includes(e.key)) {
        e.preventDefault();
      }
    };

    const onUp = (e: KeyboardEvent) => {
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
  const consumeJustPressed = useCallback((action: string): boolean => {
    if (action === 'jump') {
      const pressTime = justPressed.current.jump as number;
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
