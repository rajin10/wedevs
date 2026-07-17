// BROKEN ON PURPOSE — see README.md. Expected to be caught by: no-restricted-syntax
//
// Note there is no TODO comment anywhere in this file. A comment-scanning rule
// cannot see any of this, because a stub is code, not a comment. That is why
// both rules exist.

export function chargeCard(): never {
  throw new Error("not implemented");
}

export function refund(): never {
  throw new Error("Unimplemented");
}

export function sync(): never {
  throw new Error("stub");
}
