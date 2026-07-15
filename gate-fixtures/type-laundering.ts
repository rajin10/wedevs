// BROKEN ON PURPOSE — see README.md. Expected to be caught by: no-restricted-syntax
//
// This file contains no 'any' keyword, so no-explicit-any is blind to it.
// That is the point: 'as unknown as X' is the standard way to launder a
// wrong type past a type check, and it is what an agent reaches for when
// the types don't line up and the deadline does.

interface User {
  id: string;
  email: string;
}

export function coerce(input: string): User {
  return input as unknown as User;
}

export function alsoBad(n: number): User[] {
  return n as unknown as User[];
}
