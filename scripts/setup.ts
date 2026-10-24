/**
 * Prepares the database: creates tables, the starter collections (Necklaces, Rings, …),
 * and (on a fresh install only) the sample products.
 *
 *   npm run setup                 # first-time setup with sample products
 *   npm run setup -- --no-samples # first-time setup without them
 */
import { getDb, DATA_DIR } from "../src/lib/db";
import { seedSampleProducts, seedStructure } from "../src/lib/seed";

async function main() {
  const db = getDb();
  console.log(`Database ready in ${DATA_DIR}`);

  seedStructure();

  const productCount = (db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;
  if (productCount === 0 && !process.argv.includes("--no-samples")) {
    await seedSampleProducts();
    console.log("Added sample products (marked “Sample” — remove them from the dashboard overview).");
  } else {
    console.log(`Products already exist (${productCount}); no samples added.`);
  }

  const owners = (db.prepare("SELECT COUNT(*) AS n FROM owners").get() as { n: number }).n;
  if (owners === 0) console.log("\nNext: create the owner login with  npm run owner:create");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
