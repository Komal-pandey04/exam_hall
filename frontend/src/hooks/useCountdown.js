import { useEffect, useRef, useState } from 'react';

const secondsLeft = (endTime) => Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

/**
 * Real countdown based on an absolute end timestamp.
 *  - Every tick recomputes `endTime - Date.now()`, so delayed/throttled intervals
 *    (background tabs, sleeping laptops) can never make the timer drift.
 *  - It re-syncs instantly when the tab becomes visible again.
 *  - onExpire fires exactly once.
 */
export function useCountdown(endTime, onExpire) {
  const [remaining, setRemaining] = useState(() => secondsLeft(endTime));
  const expireRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => {
    expireRef.current = onExpire;
  });

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const left = secondsLeft(endTime);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        expireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    window.addEventListener('online', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
      window.removeEventListener('online', tick);
    };
  }, [endTime]);

  return remaining;
}
