import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const UID = 'api::product.product';
const SLUG = 'meditation-mat-puja-asana';

// First file is the main image; the rest fill the gallery in this order.
const IMAGES = [
  { file: 'meditation-mat-1-folded-with-tag.jpg', alt: 'Folded purple and gold temple-saree Meditation Mat tied with cotton twine and a Vairutya tag' },
  { file: 'meditation-mat-2-puja-setting.jpg', alt: 'The Meditation Mat laid open on a stone floor beside a brass lamp, a puja plate and marigold flowers' },
  { file: 'meditation-mat-3-draped-fabric.jpg', alt: 'Purple silk mat with gold zari paisley borders draped on a table beside a singing bowl and a plant' },
  { file: 'meditation-mat-4-zari-detail.jpg', alt: 'Close-up of the woven gold zari border and brocade texture on a folded mat' },
];

const ENGLISH = {
  name: 'Meditation Mat (Puja Asana)',
  description:
    'A sacred, compact 21"\u00A0×\u00A021" textile asana handcrafted from upcycled temple sarees that once graced the Goddess. Designed to ground your meditation, breathwork, and daily puja rituals with reverence and quiet luxury.',
  tags: ['Upcycled Temple Sarees', 'Handcrafted', 'One of a Kind', 'Meditation & Puja'],
  tabs: [
    {
      tabId: 'description',
      label: 'Description',
      sections: [
        {
          heading: 'The Story',
          body:
            'Bring the sacred energy of the temple into your daily practice. Each Vairutya Meditation Asana is lovingly created from authentic, preloved silk sarees offered to deities within sacred Indian temples. After gracing the inner sanctum, these heirloom textiles are thoughtfully acquired through temple offerings, upcycled, and handcrafted into compact, beautiful 21"\u00A0×\u00A021" square designed specifically for meditation, puja, and mindfulness.',
        },
        {
          body:
            'Featuring exquisite woven gold zari borders and rich brocade textures, every mat serves as a tangible bridge between divine tradition and conscious living.',
        },
      ],
      noteHeading: 'Important Note on Availability & Variations',
      noteBody:
        'One-of-a-Kind Heirloom Pieces: Because our textiles are sourced directly from sacred temple offerings, no two mats are ever alike. The images provided on our website are representative of the craft style and quality. Color and Pattern: The mat you receive will be strictly subject to availability. While we ensure each piece is meticulously inspected and free of major flaws, we cannot control or replicate specific colors, motifs, or woven patterns from batch to batch. Embracing these unique variations is part of the sacred journey of conscious ownership.',
    },
    {
      tabId: 'features',
      label: 'Key Features',
      sections: [
        { heading: 'Sacred Origin', body: 'Upcycled from authentic temple-offered sarees, honoring a sustainable lifecycle of textile devotion.' },
        {
          heading: 'Compact & Versatile Size',
          body: 'Measures 21"\u00A0×\u00A021" ideally sized to fit neatly beneath your seat as a personal sacred anchor during meditation, pranayama, or puja ceremonies.',
        },
        {
          heading: 'Artisanal Craftsmanship',
          body:
            'Hand-finished by skilled artisans with attention to detail and traditional brocade heritage. Rich jewel tones paired with intricate gold zari work, designed to complement mindful, earthy home spaces.',
        },
      ],
    },
    {
      tabId: 'details',
      label: 'Details & Care',
      specs: [
        { label: 'Size', value: '21"\u00A0×\u00A021" (square)' },
        { label: 'Material', value: 'Upcycled silk sarees offered in sacred temples, with woven gold zari borders and brocade textures' },
        { label: 'Craft', value: 'Handcrafted and hand-finished by skilled artisans' },
        { label: 'Care', value: 'Dry clean only to preserve the delicate silk fibers and metallic gold zari weave.' },
        { label: 'Storage', value: 'Store in a dry place away from direct sunlight when not in use.' },
      ],
    },
  ],
};

// A French version, written for the French site. Please have a French speaker read it once.
const FRENCH = {
  name: 'Tapis de méditation (Puja Asana)',
  description:
    'Un asana textile sacré et compact de 21"\u00A0×\u00A021", façonné à la main à partir de saris de temple recyclés qui ont autrefois paré la Déesse. Conçu pour ancrer votre méditation, votre respiration et vos rituels de puja quotidiens, avec révérence et luxe discret.',
  tags: ['Saris de temple recyclés', 'Fait main', 'Pièce unique', 'Méditation & puja'],
  tabs: [
    {
      tabId: 'description',
      label: 'Description',
      sections: [
        {
          heading: 'L’histoire',
          body:
            'Faites entrer l’énergie sacrée du temple dans votre pratique quotidienne. Chaque asana de méditation Vairutya est créé avec amour à partir de saris en soie authentiques, déjà portés, offerts aux divinités dans les temples sacrés de l’Inde. Après avoir paré le sanctuaire intérieur, ces textiles précieux sont soigneusement recueillis grâce aux offrandes des temples, recyclés, puis façonnés à la main en un beau carré compact de 21"\u00A0×\u00A021", conçu spécialement pour la méditation, la puja et la pleine conscience.',
        },
        {
          body:
            'Ornée de somptueuses bordures en zari doré tissé et de riches textures brochées, chaque pièce est un pont tangible entre la tradition sacrée et une vie consciente.',
        },
      ],
      noteHeading: 'Remarque importante sur la disponibilité et les variations',
      noteBody:
        'Des pièces uniques, précieuses : nos textiles provenant directement d’offrandes de temples sacrés, aucun tapis n’est identique à un autre. Les images présentées sur notre site illustrent le style et la qualité de l’artisanat. Couleurs et motifs : le tapis que vous recevrez dépend strictement de la disponibilité. Chaque pièce est minutieusement inspectée et exempte de défauts majeurs, mais nous ne pouvons ni contrôler ni reproduire des couleurs, des motifs ou des tissages précis d’un lot à l’autre. Accueillir ces variations uniques fait partie du chemin sacré d’une possession consciente.',
    },
    {
      tabId: 'features',
      label: 'Caractéristiques',
      sections: [
        { heading: 'Origine sacrée', body: 'Recyclé à partir de saris authentiques offerts dans les temples, pour honorer un cycle de vie durable du textile de dévotion.' },
        {
          heading: 'Taille compacte et polyvalente',
          body: 'Mesure 21"\u00A0×\u00A021", une taille idéale pour se glisser sous votre assise comme un ancrage sacré personnel pendant la méditation, le pranayama ou les cérémonies de puja.',
        },
        {
          heading: 'Savoir-faire artisanal',
          body:
            'Finitions réalisées à la main par des artisans qualifiés, avec le souci du détail et l’héritage du brocart traditionnel. De riches tons de pierres précieuses associés à un travail de zari doré élaboré, pensés pour s’accorder aux intérieurs sereins et naturels.',
        },
      ],
    },
    {
      tabId: 'details',
      label: 'Détails et entretien',
      specs: [
        { label: 'Dimensions', value: '21"\u00A0×\u00A021" (carré)' },
        { label: 'Matière', value: 'Saris en soie recyclés offerts dans des temples sacrés, avec bordures en zari doré tissé et textures brochées' },
        { label: 'Fabrication', value: 'Façonné et finalisé à la main par des artisans qualifiés' },
        { label: 'Entretien', value: 'Nettoyage à sec uniquement, pour préserver les délicates fibres de soie et le tissage de zari métallique doré.' },
        { label: 'Rangement', value: 'À ranger dans un endroit sec, à l’abri de la lumière directe du soleil, lorsqu’il n’est pas utilisé.' },
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
 * Creates the Meditation Mat once, with its prices (₹999 / €24.99), as a DRAFT so you can check the photos
 * and wording first. Press Publish on the English entry in Content Manager → Product to put it in the shop.
 * The French version is already published, so it appears on the French site at the same moment.
 */
export async function seedMeditationMat(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'product-meditation-mat-seeded' });
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
      data: { ...toData(ENGLISH), slug: SLUG, brand: 'VAIRUTYA', priceInr: 999, priceEur: 24.99, image: main, gallery },
    });
    await store.set({ value: true });
    strapi.log.info('[product] created the Meditation Mat as a draft. Check it, then publish it.');

    try {
      await docs.update({ documentId: created.documentId, locale: 'fr', data: toData(FRENCH) });
      await docs.publish({ documentId: created.documentId, locale: 'fr' });
    } catch (err) {
      strapi.log.warn(`[product] could not add the French version of the Meditation Mat: ${(err as Error).message}`);
    }
  } catch (err) {
    strapi.log.error(`[product] could not create the Meditation Mat: ${(err as Error).message}`);
  }
}
