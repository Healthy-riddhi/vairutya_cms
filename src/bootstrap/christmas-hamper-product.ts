import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const UID = 'api::product.product';
const SLUG = 'mindful-christmas-gift-hamper';

// First file is the main image; the rest fill the gallery in this order.
const IMAGES = [
  { file: 'christmas-hamper-1-basket.jpg', alt: 'The hamper in a green temple-textile wrap inside a wicker basket, with a red velvet bow and a Merry Christmas tag' },
  { file: 'christmas-hamper-2-contents.jpg', alt: 'The hamper contents laid out on kraft paper: plantable pen box, meditation mat, fabric journal and star keychain' },
  { file: 'christmas-hamper-3-wrap.jpg', alt: 'The green handmade temple-textile drawstring wrap tied with a white cotton cord' },
  { file: 'christmas-hamper-4-pouch-held.jpg', alt: 'A hand lifting the drawstring wrap by its cotton cord' },
];

const ENGLISH = {
  name: 'The Mindful Christmas Gift Hamper',
  description:
    'A meaningful, eco-friendly Christmas gift that feels personal rather than mass-produced. Encased in a handmade temple-textile drawstring wrap, this zero-waste holiday gift set is made to be kept, reused, and lived with long after the festive season ends.',
  seoTitle: 'Temple-Textile Christmas Gift Hamper | Vairutya',
  seoDescription:
    'Gift Vairutya’s handmade temple-textile Christmas hamper. Features a meditation mat, journal, charm & plantable pen in a reusable textile wrap.',
  tags: ['Handmade Gift Set', '100% Plastic-Free', 'Reusable Temple-Textile Wrap'],
  tabs: [
    {
      tabId: 'description',
      label: 'Description',
      sections: [
        {
          body:
            'Looking for a meaningful, eco-friendly Christmas gift that feels personal rather than mass-produced? The Mindful Christmas Gift Hamper by Vairutya brings together grounded, everyday companions designed for quiet mornings, travel, and slow rituals. Encased in a handmade temple-textile drawstring wrap crafted from the same heritage weave as our meditation mat, this zero-waste holiday gift set is made to be kept, reused, and lived with long after the festive season ends.',
        },
      ],
    },
    {
      tabId: 'inside',
      label: 'What’s Inside (5 Items)',
      specs: [
        { label: 'Handmade Temple-Textile Drawstring Wrap', value: 'Handcrafted in rich temple textile so even the outer packaging becomes a lasting, reusable keepsake.' },
        { label: 'Vairutya Artisanal Meditation Mat', value: 'A compact, woven temple-textile meditation mat tied with natural cotton cord, ideal for daily pranayama, puja, or mindful stillness.' },
        { label: 'Handcrafted Journal', value: 'A vibrant, traditional fabric journal with a wooden button closure to keep journaling essentials, crystals, or travel keepsakes secure.' },
        { label: 'Artisanal Keychain', value: 'A hand-stitched floral fabric charm with a brass ring doubles as a festive Christmas tree ornament or an everyday key/bag charm.' },
        { label: 'Plantable Recycled Paper Pen', value: 'An eco-conscious stationery essential packaged in kraft paper, ready to sprout once you finish writing.' },
      ],
    },
    {
      tabId: 'why',
      label: 'Why Gift This Hamper',
      sections: [
        { heading: 'Cohesive Temple-Textile Craft', body: 'Both the outer drawstring wrap and the meditation mat share a handmade temple-textile heritage, creating a unified, tactile unboxing experience.' },
        { heading: '100% Plastic-Free & Reusable', body: 'Every layer from the handmade drawstring pouch to the kraft stationery sleeve is designed for second life and daily utility.' },
        { heading: 'Thoughtful & Ready to Gift', body: 'Arrives neatly bundled and ready to place under the tree or send directly to someone special.' },
      ],
    },
  ],
};

// French version for the France storefront (translated by me from your document). Please have a French speaker read it once.
const FRENCH = {
  name: 'Le coffret cadeau de Noël Mindful',
  description:
    'Un cadeau de Noël plein de sens et respectueux de la planète, personnel plutôt que produit en série. Présenté dans une pochette à cordon en textile de temple faite à la main, ce coffret zéro déchet est pensé pour être gardé, réutilisé et vécu bien après les fêtes.',
  seoTitle: 'Coffret cadeau de Noël en textile de temple | Vairutya',
  seoDescription:
    'Offrez le coffret de Noël Vairutya en textile de temple, fait main : tapis de méditation, carnet, porte-bonheur et stylo à planter dans une pochette en tissu réutilisable.',
  tags: ['Coffret fait main', '100 % sans plastique', 'Pochette réutilisable en textile de temple'],
  tabs: [
    {
      tabId: 'description',
      label: 'Description',
      sections: [
        {
          body:
            'Vous cherchez un cadeau de Noël plein de sens, écologique et personnel plutôt que produit en série ? Le coffret cadeau de Noël Mindful de Vairutya réunit des compagnons simples et ancrés, conçus pour les matins tranquilles, les voyages et les rituels lents. Présenté dans une pochette à cordon en textile de temple faite à la main, tissée dans le même savoir-faire que notre tapis de méditation, ce coffret de fêtes zéro déchet est fait pour être gardé, réutilisé et vécu bien après la saison des fêtes.',
        },
      ],
    },
    {
      tabId: 'inside',
      label: 'Contenu (5 articles)',
      specs: [
        { label: 'Pochette à cordon en textile de temple, faite main', value: 'Confectionnée à la main dans un riche textile de temple : même l’emballage devient un souvenir durable et réutilisable.' },
        { label: 'Tapis de méditation artisanal Vairutya', value: 'Un tapis de méditation compact en textile de temple tissé, noué d’un cordon de coton naturel, idéal pour le pranayama quotidien, la puja ou l’immobilité attentive.' },
        { label: 'Carnet artisanal', value: 'Un carnet en tissu traditionnel aux couleurs vives, avec fermeture par bouton en bois, pour garder en sécurité vos notes, vos cristaux ou vos souvenirs de voyage.' },
        { label: 'Porte-clés artisanal', value: 'Un porte-bonheur en tissu fleuri cousu main, avec anneau en laiton : à la fois décoration de sapin de Noël et porte-clés ou charm de sac au quotidien.' },
        { label: 'Stylo à planter en papier recyclé', value: 'Un essentiel de papeterie écologique, présenté dans du papier kraft, prêt à germer une fois que vous avez fini d’écrire.' },
      ],
    },
    {
      tabId: 'why',
      label: 'Pourquoi l’offrir',
      sections: [
        { heading: 'Un savoir-faire textile de temple harmonieux', body: 'La pochette à cordon et le tapis de méditation partagent le même héritage de textile de temple fait main, pour une expérience de déballage cohérente et tactile.' },
        { heading: '100 % sans plastique et réutilisable', body: 'Chaque couche, de la pochette à cordon faite main à l’étui kraft de la papeterie, est pensée pour une seconde vie et un usage quotidien.' },
        { heading: 'Réfléchi et prêt à offrir', body: 'Livré soigneusement regroupé, prêt à être posé sous le sapin ou envoyé à une personne qui vous est chère.' },
      ],
    },
  ],
};

const toData = (c: typeof ENGLISH) => ({
  name: c.name,
  description: c.description,
  seoTitle: c.seoTitle,
  seoDescription: c.seoDescription,
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
 * Creates The Mindful Christmas Gift Hamper once, with its prices (₹999 / €9.99), as a DRAFT so you can check the
 * photos and wording first. Press Publish on the English entry in Content Manager → Product to put it in the shop.
 * The French version is already published, so it appears on the French site at the same moment.
 */
export async function seedChristmasHamper(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'product-christmas-hamper-seeded' });
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
      data: { ...toData(ENGLISH), slug: SLUG, brand: 'VAIRUTYA', priceInr: 999, priceEur: 9.99, image: main, gallery },
    });
    await store.set({ value: true });
    strapi.log.info('[product] created The Mindful Christmas Gift Hamper as a draft. Check it, then publish it.');

    try {
      await docs.update({ documentId: created.documentId, locale: 'fr', data: toData(FRENCH) });
      await docs.publish({ documentId: created.documentId, locale: 'fr' });
    } catch (err) {
      strapi.log.warn(`[product] could not add the French version of the Christmas hamper: ${(err as Error).message}`);
    }
  } catch (err) {
    strapi.log.error(`[product] could not create the Christmas hamper: ${(err as Error).message}`);
  }
}
