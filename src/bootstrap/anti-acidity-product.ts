import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const UID = 'api::product.product';
const SLUG = 'anti-acidity-botanical-blend';

// First file is the main image; the rest fill the gallery in this order.
const IMAGES = [
  { file: 'anti-acidity-blend-1-hero.jpg', alt: 'Hand holding a jar of the Vairutya Anti-Acidity Botanical Blend with its round label' },
  { file: 'anti-acidity-blend-2-jars.jpg', alt: 'Three jars of the Anti-Acidity Botanical Blend with rose petals and seeds' },
  { file: 'anti-acidity-blend-4-top.jpg', alt: 'Top view of the jar showing fennel seeds, rose petals and pink salt' },
  { file: 'anti-acidity-blend-3-scoop.jpg', alt: 'Golden scoop lifting the seed and rose petal blend from the jar' },
  { file: 'anti-acidity-blend-5-lid.jpg', alt: 'Close-up of the gold fabric lid, twine and label' },
];

/** Uploads the product photos through Strapi's upload plugin (Cloudinary when it is configured). */
async function uploadImages(strapi: Core.Strapi): Promise<number[]> {
  const root = (strapi as any).dirs?.app?.root ?? process.cwd();
  const dir = path.join(root, 'data', 'product-images');
  const upload = (strapi.plugin('upload') as any).service('upload');
  const ids: number[] = [];
  for (const img of IMAGES) {
    const filepath = path.join(dir, img.file);
    if (!fs.existsSync(filepath)) throw new Error(`image not found: ${filepath}`);
    const [saved] = await upload.upload({
      data: { fileInfo: { name: img.file, alternativeText: img.alt } },
      files: { filepath, originalFilename: img.file, mimetype: 'image/jpeg', size: fs.statSync(filepath).size },
    });
    ids.push(saved.id);
  }
  return ids;
}

/**
 * Creates the Anti-Acidity Botanical Blend once, as a DRAFT with no price.
 * The shop only lists products that have a price, so set the prices and press Publish in the admin.
 */
export async function seedAntiAcidityProduct(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'product-anti-acidity-seeded' });
    if (await store.get()) return;

    const docs = (strapi as any).documents(UID);
    if (await docs.findFirst({ filters: { slug: SLUG } })) {
      await store.set({ value: true });
      return; // already there: leave your edits alone
    }

    const [main, ...gallery] = await uploadImages(strapi);

    await docs.create({
      locale: 'en',
      status: 'draft',
      data: {
        name: 'Anti-Acidity Botanical Blend',
        slug: SLUG,
        brand: 'VAIRUTYA',
        description: 'A cooling botanical seed and petal blend to soothe digestive agni and pacify pitta naturally.',
        image: main,
        gallery,
        tags: [{ text: '100% Natural' }, { text: 'Pitta-Pacifying' }, { text: 'Post-Meal Ritual' }],
        tabs: [
          {
            tabId: 'description',
            label: 'Description',
            sections: [
              {
                heading: 'Ayurvedic Post-Meal Digestive Mukhwas & Cooling Infusion',
                body:
                  'Rooted in ancient Ayurvedic wisdom and crafted for modern conscious living, the Vairutya Anti-Acidity Botanical Blend is a restorative post-meal ritual. Designed to gently cool the body and ease inner heat, this harmonious formulation balances agni (digestive fire) while offering a refined sensory conclusion to your meal.',
              },
              {
                body:
                  'Each batch is meticulously composed of soothing botanical seeds and delicate rose petals, working synergistically to pacify excess pitta and restore natural digestive harmony. Housed in our signature bamboo glass vessel adorned with textured gold-accented closures and artisanal detailing, it brings both holistic wellness and quiet luxury to your daily routine.',
              },
            ],
          },
          {
            tabId: 'ritual',
            label: 'The Ritual',
            sections: [
              {
                heading: 'Usage',
                body: 'Gently shake well before use. Partake a small spoonful leisurely following your principal meal to encourage smooth digestion and internal cooling.',
              },
              {
                heading: 'Key Benefits',
                body: 'Pacifies pitta, soothes digestive warmth, and provides a calming post-meal sensory experience.',
              },
            ],
          },
          {
            tabId: 'details',
            label: 'Key Details & Specifications',
            specs: [
              { label: 'Net Weight', value: '150g (Bamboo Glass Jar with Artisanal Fabric Finish)' },
              { label: 'Formulation', value: '100% Natural Ayurvedic Post-Meal Mukhwas' },
              { label: 'Key Ingredients', value: 'Anis Seeds, Sesame Seeds, Organic Rose Petals, and Digestif Spices' },
            ],
          },
        ],
      },
    });

    await store.set({ value: true });
    strapi.log.info('[product] created the Anti-Acidity Botanical Blend as a draft. Set its prices, then publish it.');
  } catch (err) {
    strapi.log.error(`[product] could not create the Anti-Acidity Botanical Blend: ${(err as Error).message}`);
  }
}
