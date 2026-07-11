import type { NextConfig } from "next";
const config: NextConfig = { output: "standalone", transpilePackages: ["@wedevs/ui", "@wedevs/shared"] };
export default config;
