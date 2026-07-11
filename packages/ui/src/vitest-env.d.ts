// Registers @testing-library/jest-dom matchers (toBeInTheDocument, toHaveClass, …)
// with Vitest's `expect` at the TYPE level for every *.test.tsx in this package.
// It lives under `src` so `tsc --noEmit` sees it program-wide — no per-test-file
// import is needed, and it survives regardless of which test files exist.
// (Runtime matcher registration is done separately in vitest.setup.ts.)
import "@testing-library/jest-dom/vitest";
