import { formatBytes } from "@wedevs/shared";

function main(): void {
  // Phase 5/7 replace this with a BullMQ consumer. Phase 0 proves boot + workspace import.
  console.log(`wedevs worker ready (self-check: ${formatBytes(1_258_291)})`);
}

main();
