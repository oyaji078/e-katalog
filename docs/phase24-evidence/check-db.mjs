import { getDb } from '../../src/lib/db';
async function main() {
  const db = getDb();
  const schema = await db['$queryRawUnsafe']('SHOW COLUMNS FROM PromoBanner');
  console.log(JSON.stringify(schema, null, 2));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
