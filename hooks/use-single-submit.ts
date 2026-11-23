"use client";
// React & Next
import React from "react";

// a server action that ends in redirect() rejects with this digest on the client (the page is
// already changing: the action succeeded)
const isRedirect = (error: unknown) =>
  typeof (error as { digest?: unknown })?.digest === "string" &&
  (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");

/**
 * one submission at a time: a second submit while one is running is ignored (a double tap, enter
 * plus the button). after a success that redirects, it stays pending until the page changes, so
 * the button can't send the used code again (that second send showed "wrong code")
 * @returns pending, for the button, and run(fn), which returns fn's result or undefined when ignored
 */
export function useSingleSubmit() {
  const busy = React.useRef(false);
  const [pending, setPending] = React.useState(false);

  const run = React.useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busy.current) return undefined;
    busy.current = true;
    setPending(true);

    try {
      const result = await fn();
      busy.current = false;
      setPending(false);
      return result;
    } catch (error) {
      if (!isRedirect(error)) {
        busy.current = false;
        setPending(false);
      }
      throw error;
    }
  }, []);

  return { pending, run };
}
