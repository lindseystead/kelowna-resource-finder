/**
 * @fileoverview Current time hook for reactive UI updates
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Hook to get current time that updates every 10 seconds.
 * Used to trigger re-renders for open/closed status.
 * 
 * Note: The actual timezone calculation happens in lib/hours.ts using
 * Intl.DateTimeFormat with 'America/Vancouver' timezone, which automatically
 * handles DST. This hook just provides a reactive timestamp.
 */

import { useState, useEffect } from "react";

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update every 10 seconds for responsive UI
    // This triggers re-renders so isOpenNow() recalculates with current time
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return currentTime;
}

