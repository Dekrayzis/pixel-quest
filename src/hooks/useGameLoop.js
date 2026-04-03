import { useEffect, useRef } from 'react';

/**
 * Runs a callback on every animation frame.
 * Passes delta-time (ms) to the callback.
 * Automatically cleans up on unmount.
 * Uses a cancelled flag to be robust under React StrictMode double-invocation.
 */
export default function useGameLoop(callback, running = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    let lastTime = null;

    const loop = (timestamp) => {
      if (cancelled) return;
      if (lastTime === null) lastTime = timestamp;
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      // Cap delta to avoid spiral of death on tab-switch
      const cappedDt = Math.min(dt, 33); // ~30 fps minimum
      cbRef.current(cappedDt);

      if (!cancelled) {
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);
    return () => {
      cancelled = true;
    };
  }, [running]);
}
