import { useEffect, useState, useCallback } from 'react';
import { InputState } from '../types';

// Shared key mapping to avoid duplication
const KEY_MAPPINGS = {
  'arrowleft': 'left',
  'a': 'left',
  'arrowright': 'right',
  'd': 'right',
  'arrowup': 'up',
  'w': 'up',
  'arrowdown': 'down',
  's': 'down',
  ' ': 'space',
  'f': 'fire',
} as const;

export default function useInput(): { keys: InputState['keys']; consumeJustPressed: (key: string) => boolean } {
  const [state, setState] = useState<InputState>(() => ({
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      fire: false,
    },
    justPressed: new Set(),
  }));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setState((prev) => {
      const keys = { ...prev.keys };
      const justPressed = new Set(prev.justPressed);
      
      const keyName = KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS];
      if (keyName) {
        keys[keyName] = true;
        if (!prev.keys[keyName]) justPressed.add(keyName);
      }
      
      return { keys, justPressed };
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setState((prev) => {
      const keys = { ...prev.keys };
      
      const keyName = KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS];
      if (keyName) {
        keys[keyName] = false;
      }
      
      return { ...prev, keys };
    });
  }, []);

  const consumeJustPressed = useCallback((key: string): boolean => {
    let wasPressed = false;
    setState((prev) => {
      if (prev.justPressed.has(key)) {
        wasPressed = true;
        const justPressed = new Set(prev.justPressed);
        justPressed.delete(key);
        return { ...prev, justPressed };
      }
      return prev;
    });
    return wasPressed;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { keys: state.keys, consumeJustPressed };
}
