import { sqlite } from "../src/lib/db/client";
import { migrate } from "../src/lib/db/migrate";
import { nowIso } from "../src/lib/time";
import { hasFullCatalog, seedCatalog, seedProductCount } from "./seed-data/catalog";
import { findAdmin, seedApiKey, seedCommerce, seedIdentity } from "./seed-data/commerce";

async function closeQuietly() {
  try {
    await sqlite.close();
  } catch {
    // libsql close can throw on already-closed pool
  }
}

async function main() {
  await migrate();
  const created = nowIso();
  const existingAdmin = await findAdmin();
  const catalogReady = await hasFullCatalog();

  if (existingAdmin && catalogReady) {
    console.log(`Avaluna already seeded (${await seedProductCount()} seed products); skipping.`);
    await closeQuietly();
    return;
  }

  let keyId = "ak_demo_local_only";
  let keySecret = "as_demo_local_only";
  if (!existingAdmin) {
    const adminRow = await seedIdentity(created);
    const keys = await seedApiKey(adminRow.id, created);
    keyId = keys.keyId;
    keySecret = keys.keySecret;
    await seedCommerce(created);
  }

  const summary = await seedCatalog(created);
  console.log(
    `Avaluna catalog seeded: ${summary.products} products, ${summary.categories} categories, ${summary.tags} tags.`,
  );

  if (!existingAdmin) {
    console.log("Avaluna commerce seeded.");
    console.log("Service key_id:", keyId);
    console.log("Service key_secret:", keySecret);
  }
  await closeQuietly();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
