import { useEffect, useRef, useState, useCallback } from "react";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_SECONDS = 30;

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export const useSessionTimeout = (onLogout: () => void) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningActive = useRef(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  const doLogout = useCallback(() => {
    clearAllTimers();
    warningActive.current = false;
    setShowWarning(false);
    onLogoutRef.current();
  }, [clearAllTimers]);

  const startWarning = useCallback(() => {
    warningActive.current = true;
    setShowWarning(true);
    setCountdown(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;
    countdownTimer.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        doLogout();
      }
    }, 1000);
  }, [doLogout]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(startWarning, INACTIVITY_LIMIT);
  }, [startWarning]);

  const keepAlive = useCallback(() => {
    clearAllTimers();
    warningActive.current = false;
    setShowWarning(false);
    setCountdown(COUNTDOWN_SECONDS);
    startInactivityTimer();
  }, [clearAllTimers, startInactivityTimer]);

  // Activity listener — stable ref to avoid effect re-runs
  const handleActivity = useCallback(() => {
    if (warningActive.current) return;
    startInactivityTimer();
  }, [startInactivityTimer]);

  useEffect(() => {
    startInactivityTimer();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [handleActivity, startInactivityTimer, clearAllTimers]);

  return { showWarning, countdown, keepAlive, logout: doLogout };
};
