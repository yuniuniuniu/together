import { useEffect, useRef, useState } from 'react';

export const useFixedTopBar = () => {
  const topBarRef = useRef<HTMLElement | null>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  useEffect(() => {
    const element = topBarRef.current;
    if (!element) return;

    const updateHeight = () => {
      setTopBarHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return {
    topBarRef,
    topBarHeight,
  };
};
