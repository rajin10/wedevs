import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom has no ResizeObserver; cmdk (used by the Command primitive/CommandPalette)
// observes size internally, so provide a no-op shim for every test file.
if (
  typeof window !== "undefined" &&
  typeof window.ResizeObserver === "undefined"
) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom does not implement scrollIntoView; cmdk calls it when moving the
// active row via keyboard, so provide a no-op shim for every test file.
if (
  typeof Element !== "undefined" &&
  typeof Element.prototype.scrollIntoView !== "function"
) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

afterEach(() => {
  cleanup();
});
