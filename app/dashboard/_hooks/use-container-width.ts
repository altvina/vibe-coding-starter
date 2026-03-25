'use client';

import { useEffect, useRef, useState } from 'react';

export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const element = ref.current;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      setWidth((prev) => (prev === next ? prev : next));
    });

    observer.observe(element);
    setWidth(Math.round(element.getBoundingClientRect().width));

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, width };
}
