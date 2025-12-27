import { useState, useLayoutEffect } from 'react';

export function useContainerRect(ref: React.RefObject<HTMLElement>) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if ((window as any).__RENDER_MODE__) {
      // Return fixed 1920x1080 rect if in render mode
      // Assuming container is full screen 1920x1080
      // We manually construct a DOMRect-like object
      const fixedRect = {
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        bottom: 1080,
        right: 1920,
        x: 0,
        y: 0,
        toJSON: () => {}
      } as DOMRect;
      
      setRect(fixedRect);
      return;
    }

    if (!ref.current) return;

    const updateRect = () => {
      if (ref.current) {
        setRect(ref.current.getBoundingClientRect());
      }
    };

    // Initial measure
    updateRect();
    // Double check slightly later to catch layout shifts
    requestAnimationFrame(updateRect);

    const observer = new ResizeObserver(() => {
        requestAnimationFrame(updateRect);
    });
    
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return rect;
}

