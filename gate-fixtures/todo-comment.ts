// BROKEN ON PURPOSE — see README.md. Expected to be caught by: no-warning-comments

// TODO: wire this up properly
export function a(): number {
  return 1;
}

// The default location:"start" would let this one through, which is exactly
// where a real TODO hides. location:"anywhere" is what catches it.
export function b(): number {
  // this is fine for now, FIXME later
  return 2;
}

/* not implemented yet, shipping the happy path first */
export function c(): number {
  return 3;
}
