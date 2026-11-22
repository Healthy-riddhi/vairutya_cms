import type { Core } from '@strapi/strapi';

const UID = 'api::product.product';
const CLOSING = 'Wishing you a luminous, peaceful, and healthy life. From all of us at Vairutya.';

type Item = [name: string, quantity: string];

// The contents that every hamper shares: the puja essentials.
const PUJA: Item[] = [
  ['Gold Ceramic Diyas', '2 units'],
  ['Betel Nut (Sopari)', '1 unit'],
  ['Lotus Stem (Kamal Kakdi)', '1 unit'],
  ['Sacred Thread (Nadachhadi)', '1 unit'],
  ['Kanku (Kumkum)', '1 unit'],
  ['Abil', '1 unit'],
  ['Gulal', '1 unit'],
  ['Sindoor', '1 unit'],
];
const MAT: Item = ['Handmade Meditation & Pooja Mat, Up-cycled Temple Textile', '1 unit'];

/**
 * The three gift hampers, written from "Diwali Hampers 1, 2 & 3" with the Diwali wording taken out.
 * They are all saved as DRAFTS with no photos and no euro price: add photos, check the contents, then publish.
 */
const HAMPERS = [
  {
    name: 'Grand Prosperity Gift Hamper',
    slug: 'grand-prosperity-gift-hamper',
    priceInr: 2999,
    description:
      'Glittering in gold and draped in shimmering festive textiles, the Vairutya Grand Prosperity Gift Hamper is a timeless symbol of light, harmony, and grand celebration.',
    tags: ['16 Items', 'Handcrafted Artisan Basket', 'Includes Temple-Textile Meditation Mat'],
    story: [
      'Housed within a handcrafted, grand artisan basket wrapped in lustrous fabric, this flagship hamper brings together complete sacred pujan offerings, indulgent gourmet treats, and mindful daily essentials. Designed for complete festival devotion and wellness, the beautiful shimmer basket remains as a timeless decorative piece for your temple space or living console long after the celebration.',
    ],
    items: [
      ['Gourmet Pecan Nuts', '1 × 150 g'],
      ['Dried Blueberries', '1 × 150 g'],
      ['Digestive Mukhvas – Anti-Acidity Ayurvedic Seed Mix', '1 × 100 g'],
      ['Bluepea Herbal Tea', '1 × 15 g'],
      MAT,
      ['Mindful Reflection Journal', '1 unit'],
      ['Precision Pen', '1 unit'],
      ['Meditation Mala', '1 unit'],
      ...PUJA,
    ] as Item[],
  },
  {
    name: 'Wealth Gift Hamper',
    slug: 'wealth-gift-hamper',
    priceInr: 1999,
    description:
      'A celebration of sacred grace and everyday abundance. The Vairutya Wealth Gift Hamper is thoughtfully curated to bring auspicious light, warmth, and vitality into every home throughout the year.',
    tags: ['14 Items', 'Reusable Textile Basket', 'Includes Temple-Textile Meditation Mat'],
    story: [
      'Presented in a medium handcrafted textile shimmer basket, this set pairs core pujan samagri with fragrant rose tea, classic whole almonds, blueberries, and our signature up-cycled temple textile meditation mat. It offers a harmonious blend of festive reverence and nourishing wellness, housed in a reusable basket built to elevate home spaces year-round.',
    ],
    items: [
      ['Premium Almonds', '1 × 150 g'],
      ['Blueberries', '1 × 150 g'],
      ['Artisanal Rose Tea', '1 × 35 g'],
      MAT,
      ['Mindful Reflection Journal', '1 unit'],
      ['Precision Pen', '1 unit'],
      ...PUJA,
    ] as Item[],
  },
  {
    name: 'Mindful Health Gift Hamper',
    slug: 'mindful-health-gift-hamper',
    priceInr: 999,
    description:
      'Rooted in inner balance and daily vitality, the Vairutya Mindful Health Gift Hamper offers a serene, modern alternative to traditional gifting.',
    tags: ['11 Items', 'Compact Handcrafted Basket', 'Includes Temple-Textile Meditation Mat'],
    story: [
      'Encased in a compact handcrafted shimmer basket, this curation focuses on clean nourishment and sacred rituals. Featuring premium almonds and golden raisins, our temple textile meditation mat, and complete sacred pujan samagri. A pure, intentional gift for those who value health and mindfulness.',
    ],
    items: [
      ['Premium Almonds', '1 × 150 g'],
      ['Premium Golden Raisins', '1 × 125 g'],
      MAT,
      ...PUJA,
    ] as Item[],
  },
];

/** Creates each hamper once, as a draft. A hamper that already exists (same slug) is left alone. */
export async function seedGiftHampers(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'product-gift-hampers-seeded' });
    if (await store.get()) return;

    const docs = (strapi as any).documents(UID);
    for (const h of HAMPERS) {
      if (await docs.findFirst({ filters: { slug: h.slug } })) continue;
      await docs.create({
        locale: 'en',
        status: 'draft',
        data: {
          name: h.name,
          slug: h.slug,
          brand: 'VAIRUTYA',
          description: h.description,
          priceInr: h.priceInr,
          tags: h.tags.map((text) => ({ text })),
          tabs: [
            {
              tabId: 'description',
              label: 'Description',
              sections: [...h.story.map((body) => ({ body })), { body: CLOSING }],
            },
            {
              tabId: 'inside',
              label: `What’s Inside (${h.items.length} Items)`,
              specs: h.items.map(([label, value]) => ({ label, value })),
            },
          ],
        },
      });
      strapi.log.info(`[product] created the ${h.name} as a draft. Add photos and a euro price, then publish it.`);
    }
    await store.set({ value: true });
  } catch (err) {
    strapi.log.error(`[product] could not create the gift hampers: ${(err as Error).message}`);
  }
}
