/** Adds the sample products again (e.g. after deleting them, for a demo). */
import { seedSampleProducts, seedStructure } from "../src/lib/seed";

async function main() {
  seedStructure();
  await seedSampleProducts();
  console.log("Sample products added.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
