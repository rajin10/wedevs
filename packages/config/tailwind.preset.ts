import type { Config } from "tailwindcss";

// Phase 1 fills the full Wedevs token set (Graphite × Volt) here.
// Phase 0 only proves the preset is importable and typed.
const preset = {
  theme: { extend: {} },
} satisfies Partial<Config>;

export default preset;
