import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react only auto-registers its afterEach(cleanup) when it
// detects a *global* afterEach function. This project's vite.config.ts sets
// `globals: false`, so that auto-detection never fires — without this,
// rendered trees from one test stay mounted in the DOM for the next test,
// causing "multiple elements" collisions and stale-render bugs.
afterEach(() => {
  cleanup();
});

if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
