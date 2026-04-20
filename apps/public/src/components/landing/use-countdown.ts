"use client";

import { useEffect, useState } from "react";

export function useCountdown(end: Date) {
  const calc = () => {
    const diff = end.getTime() - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calc()), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end]);
  return timeLeft;
}
