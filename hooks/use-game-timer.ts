import { useEffect, useRef, useState } from 'react';

export function useGameTimer(
  duration: number,
  onComplete: () => void,
  autoStart = false
) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining, onComplete]);

  const start = () => {
    setTimeRemaining(duration);
    setIsActive(true);
  };

  const pause = () => setIsActive(false);

  const reset = () => {
    setTimeRemaining(duration);
    setIsActive(false);
  };

  return { timeRemaining, isActive, start, pause, reset };
}
