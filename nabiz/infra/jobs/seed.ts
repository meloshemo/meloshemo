/**
 * Başlangıç verisini yükler: 81 il, kategoriler ve açılış soruları.
 * Idempotenttir — tekrar çalıştırmak mevcut veriyi bozmaz, eksikleri tamamlar.
 *
 * Çalıştırma: `DATABASE_URL=... npm run seed`
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { CATEGORIES, CITIES, SEED_POLLS, schema } from '@nabiz/db';

const { categories, cities, options, polls } = schema;

async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL zorunlu');

  const client = postgres(url, { max: 2, prepare: false });
  const db = drizzle(client);

  await db.insert(cities).values(CITIES.map((c) => ({
    id: c.id, slug: c.slug, name: c.name, region: c.region, population: c.population,
  }))).onConflictDoNothing();
  console.log(`${CITIES.length} il yüklendi`);

  await db.insert(categories).values(CATEGORIES.map((c) => ({
    slug: c.slug, nameTr: c.nameTr, emoji: c.emoji, sortOrder: c.sortOrder,
  }))).onConflictDoNothing();
  const categoryRows = await db.select().from(categories);
  console.log(`${categoryRows.length} kategori hazır`);

  let created = 0;
  for (const seed of SEED_POLLS) {
    const existing = await db.select({ id: polls.id }).from(polls).where(eq(polls.slug, seed.slug));
    if (existing.length > 0) continue;

    const categoryId = categoryRows.find((c) => c.slug === seed.category)?.id;
    if (categoryId === undefined) throw new Error(`Bilinmeyen kategori: ${seed.category}`);

    const [poll] = await db.insert(polls).values({
      slug: seed.slug,
      questionTr: seed.question,
      categoryId,
      status: 'live',
      // Seed soruları editoryal olarak gözden geçirilmiştir (docs/19 filtreleri).
      editorialOk: true,
      publishedAt: new Date(),
    }).returning();

    await db.insert(options).values(seed.options.map((option, index) => ({
      pollId: poll!.id, labelTr: option.label, emoji: option.emoji, position: index,
    })));
    created += 1;
  }

  console.log(`${created} yeni soru yayınlandı`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
