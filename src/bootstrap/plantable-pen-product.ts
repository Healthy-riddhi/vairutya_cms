import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const UID = 'api::product.product';
const SLUG = 'plantable-recycled-pen';

// First file is the main image; the rest fill the gallery in this order.
const IMAGES = [
  { file: 'plantable-pen-1-box-and-pen.jpg', alt: 'Vairutya Write Green kraft box beside the plantable pen and its seed cap on a wooden desk' },
  { file: 'plantable-pen-2-pen-closeup.jpg', alt: 'Close-up of the recycled-paper pen with its blue ballpoint tip, and the cap that holds the basil seeds' },
  { file: 'plantable-pen-3-writing.jpg', alt: 'A hand writing "Vairutya" in a journal with the plantable pen' },
  { file: 'plantable-pen-4-box-photo.jpg', alt: 'The Vairutya Write Green kraft box, made from 100% recycled paper, photographed flat' },
  { file: 'plantable-pen-5-box-on-table.jpg', alt: 'The Write Green kraft box on a wooden desk beside a small plant and a journal' },
  { file: 'plantable-pen-6-basil-label.jpg', alt: 'The pen barrel printed "Plantable Pen, Basil" next to fresh basil leaves' },
];

const ENGLISH = {
  name: 'Plantable Recycled Pen',
  description:
    'Mindful writing that returns to the earth. Crafted from 100% recycled kraft paper, this smooth blue-ink ballpoint pen houses living basil seeds, transforming a daily ritual into a quiet act of renewal.',
  tags: ['100% Recycled Paper', 'Basil Seeds Inside', 'Blue Ink Ballpoint'],
  tabs: [
    {
      tabId: 'description',
      label: 'Description',
      sections: [
        {
          body:
            'Designed to replace single-use plastic stationery with intention, the Vairutya Plantable Basil Pen brings conscious living to your desk. Each lightweight barrel and cap is rolled from durable, 100% recycled paper and presented in a custom Vairutya kraft sleeve. Once the blue ink runs dry, the pen’s journey continues: simply plant the seed-end in soil, water gently, and watch fresh aromatic basil sprout.',
        },
      ],
    },
    {
      tabId: 'details',
      label: 'Key Details',
      specs: [
        { label: 'Material', value: '100% recycled, biodegradable kraft paper body and cap' },
        { label: 'Ink', value: 'Smooth-flowing blue ballpoint refill' },
        { label: 'Seeds', value: 'Non-GMO Basil (Ocimum basilicum)' },
        {
          label: 'Care & Planting',
          value:
            'Once finished writing, insert the seed tip into moist soil at a 45° angle, keep in warm indirect sunlight, and water lightly until germination (typically 7–14 days).',
        },
      ],
    },
  ],
};

// French version for the France storefront (the name comes from your document; the rest I translated).
// Please have a French speaker read it once.
const FRENCH = {
  name: 'Stylo Recyclé à Planter',
  description:
    'Une écriture en pleine conscience qui retourne à la terre. Fabriqué à partir de papier kraft 100 % recyclé, ce stylo à bille à l’encre bleue fluide renferme des graines de basilic vivantes, transformant un rituel quotidien en un discret acte de renouveau.',
  tags: ['Papier 100 % recyclé', 'Graines de basilic', 'Bille à encre bleue'],
  tabs: [
    {
      tabId: 'description',
      label: 'Description',
      sections: [
        {
          body:
            'Conçu pour remplacer avec intention les articles de papeterie en plastique à usage unique, le stylo Vairutya à planter (basilic) apporte la vie consciente sur votre bureau. Chaque corps et chaque capuchon, léger, est roulé dans un papier 100 % recyclé et résistant, et présenté dans un étui kraft Vairutya sur mesure. Lorsque l’encre bleue est épuisée, le voyage du stylo continue : il suffit de planter l’extrémité à graines dans la terre, d’arroser doucement et de regarder pousser un basilic frais et aromatique.',
        },
      ],
    },
    {
      tabId: 'details',
      label: 'Détails',
      specs: [
        { label: 'Matière', value: 'Corps et capuchon en papier kraft 100 % recyclé et biodégradable' },
        { label: 'Encre', value: 'Recharge de stylo à bille bleue, à l’écriture fluide' },
        { label: 'Graines', value: 'Basilic non OGM (Ocimum basilicum)' },
        {
          label: 'Entretien et plantation',
          value:
            'Une fois que vous avez fini d’écrire, enfoncez l’extrémité à graines dans une terre humide, à un angle de 45°, placez-la dans un endroit chaud à la lumière indirecte et arrosez légèrement jusqu’à la germination (généralement 7 à 14 jours).',
        },
      ],
    },
  ],
};

const toData = (c: typeof ENGLISH) => ({
  name: c.name,
  description: c.description,
  tags: c.tags.map((text) => ({ text })),
  tabs: c.tabs,
});

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
 * Creates the Plantable Recycled Pen once, with its prices (₹49 / €4.99), as a DRAFT so you can check the
 * photos and wording first. Press Publish on the English entry in Content Manager → Product to put it in
 * the shop. The French version is already published, so it appears on the French site at the same moment.
 */
export async function seedPlantablePen(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'product-plantable-pen-seeded' });
    if (await store.get()) return;

    const docs = (strapi as any).documents(UID);
    if (await docs.findFirst({ filters: { slug: SLUG } })) {
      await store.set({ value: true });
      return; // already there: leave your edits alone
    }

    const [main, ...gallery] = await uploadImages(strapi);

    const created = await docs.create({
      locale: 'en',
      status: 'draft',
      data: { ...toData(ENGLISH), slug: SLUG, brand: 'VAIRUTYA', priceInr: 49, priceEur: 4.99, image: main, gallery },
    });
    await store.set({ value: true });
    strapi.log.info('[product] created the Plantable Recycled Pen as a draft. Check it, then publish it.');

    try {
      await docs.update({ documentId: created.documentId, locale: 'fr', data: toData(FRENCH) });
      await docs.publish({ documentId: created.documentId, locale: 'fr' });
    } catch (err) {
      strapi.log.warn(`[product] could not add the French version of the Plantable Recycled Pen: ${(err as Error).message}`);
    }
  } catch (err) {
    strapi.log.error(`[product] could not create the Plantable Recycled Pen: ${(err as Error).message}`);
  }
}
