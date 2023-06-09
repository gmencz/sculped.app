import type { User } from "@prisma/client";
import { useMatches } from "@remix-run/react";
import type { RefObject } from "react";
import { useMemo } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Declarative interval.
 * More info: https://overreacted.io/making-setinterval-declarative-with-react-hooks
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }

    if (delay) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Delay the execution of a function or a state update with useDebounce.
 * @param value The value that you want to debounce.
 * @param delay The delay time in milliseconds. After this amount of time, the latest value is used.
 * @returns The debounced value. After the delay time has passed without the value changing, this will be updated to the latest value.
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Check if a CSS media query matches.
 * @param query The CSS media query.
 * @returns whether the media query matches or not.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}

/**
 * Fallback to a ref if one is not provided to the component forwarding it.
 * @param forwardedRef The ref that might have been forwarded or not.
 * @returns The forwarded ref if it exists, otherwise a fallback ref.
 */
export function useFallbackRef<T>(forwardedRef: RefObject<T>) {
  const fallbackRef = useRef<T>(null);
  return forwardedRef || fallbackRef;
}

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.id === "string";
}

/**
 * Get the current user.
 * @returns The user if it exists or undefined.
 */
export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

export type MatchWithHeader<Data = unknown> = {
  header: (data: Data) => string;
  links: {
    type: "new";
    label: string;
    to: string;
  }[];
};

export function useMatchWithHeader<Data>() {
  const matches = useMatches();
  const match = matches.find((m) => m.handle?.header && m.handle.links);
  const handle = match?.handle as MatchWithHeader<Data> | undefined;
  return { handle, data: match?.data as Data };
}
