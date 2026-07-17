import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * A function that only throws is a promise to implement it later. Later never
 * comes, and it typechecks and builds perfectly in the meantime.
 * Applied everywhere, including tests.
 */
const STUB_THROW = {
  selector:
    "ThrowStatement > NewExpression[callee.name='Error'] > Literal[value=/not.?implemented|unimplemented|^stub|placeholder/i]",
  message: "Stub throw. Implement it, or don't merge it. (AGENTS.md: no placeholders)",
};

/**
 * `(x as unknown) as Y` contains no `any` keyword, so no-explicit-any is blind
 * to it. It is the standard way to launder a wrong type past every check.
 * Relaxed in tests, where mocking a global legitimately requires it.
 */
const TYPE_LAUNDERING = {
  selector: "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
  message: "'as unknown as X' launders a type past every check. Type it properly.",
};

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  { ignores: ["dist/**", ".next/**", ".turbo/**", "coverage/**"] },

  // ---------------------------------------------------------------------
  // Placeholder gate. Unfinished work must not reach main.
  //
  // Two deliberate exclusions, both learned by measuring before enforcing:
  //
  // 1. "placeholder" is NOT a warning term. It legitimately appears in UI
  //    comments describing input placeholders (18 valid uses today).
  // 2. Test files get a narrower rule set (see the override below). Empty
  //    methods in a jsdom shim and `as unknown as` when mocking a global are
  //    correct there, not sloppy.
  //
  // A rule that cries wolf gets disabled, and a disabled rule protects nothing.
  // ---------------------------------------------------------------------
  {
    rules: {
      // Comments. location:"anywhere" matters — the default "start" only
      // checks the first word, so a marker buried mid-comment sails through,
      // and mid-comment is exactly where they hide.
      //
      // (This rule caught its own documentation when that sentence spelled the
      //  marker out literally. Working as intended. The words stay spelled
      //  around, not disabled — an exemption for ourselves is the first crack.)
      "no-warning-comments": [
        "error",
        {
          terms: [
            "todo",
            "fixme",
            "xxx",
            "hack",
            "not implemented",
            "unimplemented",
            "lorem ipsum",
            "in a real implementation",
          ],
          location: "anywhere",
        },
      ],

      // Code. no-warning-comments cannot see any of this: a stub is not a comment.
      "no-restricted-syntax": ["error", STUB_THROW, TYPE_LAUNDERING],

      // An empty body is a promise nobody kept.
      "no-empty-function": ["error", { allow: ["arrowFunctions", "constructors"] }],
      "@typescript-eslint/no-empty-function": "off",
    },
  },

  // Tests and setup files. A no-op shim method and a mocked global are the
  // legitimate uses of exactly the two patterns banned above. Stub throws and
  // warning-comment markers are still errors here — unfinished is unfinished.
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/vitest.setup.ts",
      "**/vitest.config.ts",
      "**/test/**",
      "**/__tests__/**",
    ],
    rules: {
      "no-restricted-syntax": ["error", STUB_THROW],
      "no-empty-function": "off",
    },
  },

  // Test fixtures that PROVE the gate fires. These files are intentionally
  // full of violations; scripts/verify-gates.mjs asserts eslint rejects them.
  // If this directory ever lints clean, the gate is dead.
  { ignores: ["**/gate-fixtures/**"] },
);
