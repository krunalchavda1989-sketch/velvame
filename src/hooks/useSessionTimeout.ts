import { useEffect, useRef, useState, useCallback } from "react";

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
const WARNING_DURATION = 30 * 1000; // 30 seconds

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export const useSessionTimeout = (onLogout: () => void) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const startWarning = useCallback(() => {
    setShowWarning(true);
    setCountdown(30);
    let remaining = 30;
    countdownTimer.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearAllTimers();
        setShowWarning(false);
        onLogout();
      }
    }, 1000);
  }, [onLogout, clearAllTimers]);

  const resetInactivityTimer = useCallback(() => {
    if (showWarning) return; // don't reset while warning is showing
    clearAllTimers();
    inactivityTimer.current = setTimeout(startWarning, INACTIVITY_LIMIT);
  }, [showWarning, clearAllTimers, startWarning]);

  const keepAlive = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(30);
    inactivityTimer.current = setTimeout(startWarning, INACTIVITY_LIMIT);
  }, [clearAllTimers, startWarning]);

  useEffect(() => {
    inactivityTimer.current = setTimeout(startWarning, INACTIVITY_LIMIT);

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    );

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
    };
  }, [resetInactivityTimer, startWarning, clearAllTimers]);

  return { showWarning, countdown, keepAlive, logout: onLogout };
};
