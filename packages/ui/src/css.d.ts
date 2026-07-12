// Ambient module declaration for side-effect CSS imports (e.g.
// `import "./AppShell.css";`). The consuming apps (Next.js/Vite) resolve
// and bundle these at build time; this only satisfies `tsc --noEmit` for
// this package, which has no bundler-provided CSS module types of its own.
declare module "*.css";
