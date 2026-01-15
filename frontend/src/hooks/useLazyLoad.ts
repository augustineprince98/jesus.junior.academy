/**
 * Lazy Loading Hook
 *
 * Hook for lazy loading elements using Intersection Observer.
 */

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseLazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

interface UseLazyLoadReturn<T extends HTMLElement> {
  ref: RefObject<T>;
  isVisible: boolean;
  hasLoaded: boolean;
}

/**
 * Hook for lazy loading elements when they enter viewport
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): UseLazyLoadReturn<T> {
  const { rootMargin = '50px', threshold = 0.1, triggerOnce = true } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already loaded and triggerOnce is true
    if (hasLoaded && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible) {
          setHasLoaded(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, hasLoaded]);

  return { ref, isVisible, hasLoaded };
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { ref, hasLoaded: shouldLoad } = useLazyLoad<HTMLImageElement>();

  useEffect(() => {
    if (!shouldLoad || !src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setError(true);
    };
  }, [src, shouldLoad]);

  return { ref, imageSrc, isLoaded, error };
}

/**
 * Hook for infinite scroll / pagination
 */
export function useInfiniteScroll(
  callback: () => void,
  options: { enabled?: boolean; rootMargin?: string } = {}
) {
  const { enabled = true, rootMargin = '100px' } = options;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, enabled, rootMargin]);

  return ref;
}

export default useLazyLoad;
