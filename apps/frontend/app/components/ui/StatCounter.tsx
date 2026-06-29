"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface StatCounterProps {
  value:  number;
  suffix?: string;
  duration?: number;
}

export default function StatCounter({ value, suffix = "", duration = 2000 }: StatCounterProps) {
  const [display, setDisplay] = useState(0);
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start     = 0;
    const end       = value;
    const steps     = 60;
    const stepTime  = duration / steps;
    let current     = start;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(parseFloat(current.toFixed(1)));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {Number.isInteger(value) ? Math.round(display) : display}
      {suffix}
    </span>
  );
}