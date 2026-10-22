/** Adds the sample products again (e.g. after deleting them, for a demo). */
import { seedCollections, seedSampleProducts, seedStructure } from "../src/lib/seed";

async function main() {
  seedStructure();
  await seedCollections();
  await seedSampleProducts();
  console.log("Sample products added.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
