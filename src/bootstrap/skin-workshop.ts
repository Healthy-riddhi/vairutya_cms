import type { Core } from '@strapi/strapi';

const UID = 'api::workshop.workshop';
const SLUG = 'healthy-happy-skin';

// The Experience Flow is written into the "About" text (not the Menu list, which the page titles "Menu" with a
// cooking icon). Blank lines split it into paragraphs on the page.
const ENGLISH = {
  title: 'Healthy, Happy Skin: The Skin Masterclass',
  category: 'Skin & Ayurveda',
  description: '90 minutes of applied science, botanical blending & facial release',
  schedule: 'Ahmedabad • Saudi Arabia • Paris',
  ctaLabel: 'Register Now',
  durationLabel: '90 Minutes',
  about: [
    'Great skin rarely comes from adding more steps—it comes from learning how to read what your skin is already telling you. Bridging modern barrier biology with classical Ayurvedic physiology, this hands-on gathering invites you to slow down and experience your skin from the inside out.',
    'Guided through a live diagnostic, custom botanical formulation, and targeted facial acupressure, you’ll walk away with a personal formula crafted for your skin’s current state—and a calm, grounded ritual to take home.',
    'The Experience Flow',
    '1. The Skin Literacy Talk: Understand the quiet dialogue between your skin barrier, pH, nervous system, and daily rhythm—translated clearly without jargon or industry noise.',
    '2. Live Skin Diagnostic: Complete a 3-minute guided check-in to uncover what your skin is actively asking for in its current state.',
    '3. Personal Acupressure Face Mapping: Identify and map the specific tension and drainage points on your own illustrated face card.',
    '4. Bespoke Botanical Formulation: Blend your own 10ml targeted facial oil roll-on using pure botanical extracts matched to your diagnostic profile.',
    '5. Guided Sensory Release & Takeaway Ritual: Experience a restorative facial mist and acupressure release sequence before leaving with your custom roll-on, personal face map, and a Vairutya starter pouch.',
  ].join('\n\n'),
  notes: [
    'Duration: 90 Minutes',
    'Format: Intimate Small-Group Experience (Limited Seats)',
    'Tour Cities: Ahmedabad • Saudi Arabia • Paris',
  ],
};

// French version for the French site. Please have a French speaker read it once.
const FRENCH = {
  title: 'Peau saine, peau heureuse : la Masterclass Peau',
  category: 'Peau et Ayurveda',
  description: '90 minutes de science appliquée, de mélange botanique et de détente du visage',
  schedule: 'Ahmedabad • Arabie saoudite • Paris',
  ctaLabel: 'S’inscrire',
  durationLabel: '90 minutes',
  about: [
    'Une belle peau vient rarement de l’ajout d’étapes : elle vient de l’apprentissage de la lecture de ce que votre peau vous dit déjà. À la croisée de la biologie moderne de la barrière cutanée et de la physiologie ayurvédique classique, cette rencontre pratique vous invite à ralentir et à découvrir votre peau de l’intérieur.',
    'Guidée par un diagnostic en direct, une formulation botanique sur mesure et une acupression ciblée du visage, vous repartirez avec une formule personnelle conçue pour l’état actuel de votre peau, et un rituel calme et ancré à emporter chez vous.',
    'Le déroulé de l’expérience',
    '1. La conférence « Culture de la peau » : comprenez le dialogue discret entre votre barrière cutanée, votre pH, votre système nerveux et votre rythme quotidien, expliqué clairement, sans jargon ni bruit commercial.',
    '2. Diagnostic de peau en direct : réalisez un bilan guidé de 3 minutes pour découvrir ce que votre peau réclame dans son état actuel.',
    '3. Cartographie personnelle des points d’acupression du visage : repérez les points de tension et de drainage propres à votre visage sur votre carte illustrée.',
    '4. Formulation botanique sur mesure : composez votre propre huile faciale en roll-on de 10 ml, à partir d’extraits botaniques purs adaptés à votre profil diagnostique.',
    '5. Détente sensorielle guidée et rituel à emporter : profitez d’une brume faciale réparatrice et d’une séquence de relâchement par acupression, avant de repartir avec votre roll-on personnalisé, votre carte du visage et une pochette de démarrage Vairutya.',
  ].join('\n\n'),
  notes: [
    'Durée : 90 minutes',
    'Format : expérience intime en petit groupe (places limitées)',
    'Villes de la tournée : Ahmedabad • Arabie saoudite • Paris',
  ],
};

const toData = (c: typeof ENGLISH) => ({
  title: c.title,
  category: c.category,
  description: c.description,
  schedule: c.schedule,
  ctaLabel: c.ctaLabel,
  durationLabel: c.durationLabel,
  about: c.about,
  notes: c.notes.map((text) => ({ text })),
});

/**
 * Creates the Skin Masterclass workshop once, as a DRAFT. It has no price, photo or dates yet (none were given):
 * add them in Content Manager → Workshop, then press Publish on the English entry.
 * The French version is already published, so it goes live in French at the same moment.
 */
export async function seedSkinWorkshop(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'workshop-skin-masterclass-seeded' });
    if (await store.get()) return;

    const docs = (strapi as any).documents(UID);
    if (await docs.findFirst({ filters: { slug: SLUG } })) {
      await store.set({ value: true });
      return; // already there: leave your edits alone
    }

    const created = await docs.create({ locale: 'en', status: 'draft', data: { ...toData(ENGLISH), slug: SLUG } });
    await store.set({ value: true });
    strapi.log.info('[workshop] created the Skin Masterclass as a draft. Add the price, a photo and dates, then publish it.');

    try {
      await docs.update({ documentId: created.documentId, locale: 'fr', data: toData(FRENCH) });
      await docs.publish({ documentId: created.documentId, locale: 'fr' });
    } catch (err) {
      strapi.log.warn(`[workshop] could not add the French version of the Skin Masterclass: ${(err as Error).message}`);
    }
  } catch (err) {
    strapi.log.error(`[workshop] could not create the Skin Masterclass: ${(err as Error).message}`);
  }
}
