import type { Core } from '@strapi/strapi';

const UID = 'api::workshop.workshop';
const SLUG = 'healthy-happy-skin';

type Step = { title: string; text: string };
type Copy = {
  title: string; category: string; description: string; schedule: string; ctaLabel: string; durationLabel: string;
  intro: string[]; flowTitle: string; steps: Step[]; sep: string; notes: string[];
};

// The Experience Flow is a numbered list with the heading "The Experience Flow" (menuTitle + menuNumbered).
const ENGLISH: Copy = {
  title: 'Healthy, Happy Skin: The Skin Masterclass',
  category: 'Skin & Ayurveda',
  description: '90 minutes of applied science, botanical blending & facial release',
  schedule: 'Ahmedabad • Saudi Arabia • Paris',
  ctaLabel: 'Register Now',
  durationLabel: '90 Minutes',
  intro: [
    'Great skin rarely comes from adding more steps—it comes from learning how to read what your skin is already telling you. Bridging modern barrier biology with classical Ayurvedic physiology, this hands-on gathering invites you to slow down and experience your skin from the inside out.',
    'Guided through a live diagnostic, custom botanical formulation, and targeted facial acupressure, you’ll walk away with a personal formula crafted for your skin’s current state—and a calm, grounded ritual to take home.',
  ],
  flowTitle: 'The Experience Flow',
  sep: ':',
  steps: [
    { title: 'The Skin Literacy Talk', text: 'Understand the quiet dialogue between your skin barrier, pH, nervous system, and daily rhythm—translated clearly without jargon or industry noise.' },
    { title: 'Live Skin Diagnostic', text: 'Complete a 3-minute guided check-in to uncover what your skin is actively asking for in its current state.' },
    { title: 'Personal Acupressure Face Mapping', text: 'Identify and map the specific tension and drainage points on your own illustrated face card.' },
    { title: 'Bespoke Botanical Formulation', text: 'Blend your own 10ml targeted facial oil roll-on using pure botanical extracts matched to your diagnostic profile.' },
    { title: 'Guided Sensory Release & Takeaway Ritual', text: 'Experience a restorative facial mist and acupressure release sequence before leaving with your custom roll-on, personal face map, and a Vairutya starter pouch.' },
  ],
  notes: [
    'Duration: 90 Minutes',
    'Format: Intimate Small-Group Experience (Limited Seats)',
    'Tour Cities: Ahmedabad • Saudi Arabia • Paris',
  ],
};

// French version for the French site. Please have a French speaker read it once.
const FRENCH: Copy = {
  title: 'Peau saine, peau heureuse : la Masterclass Peau',
  category: 'Peau et Ayurveda',
  description: '90 minutes de science appliquée, de mélange botanique et de détente du visage',
  schedule: 'Ahmedabad • Arabie saoudite • Paris',
  ctaLabel: 'S’inscrire',
  durationLabel: '90 minutes',
  intro: [
    'Une belle peau vient rarement de l’ajout d’étapes : elle vient de l’apprentissage de la lecture de ce que votre peau vous dit déjà. À la croisée de la biologie moderne de la barrière cutanée et de la physiologie ayurvédique classique, cette rencontre pratique vous invite à ralentir et à découvrir votre peau de l’intérieur.',
    'Guidée par un diagnostic en direct, une formulation botanique sur mesure et une acupression ciblée du visage, vous repartirez avec une formule personnelle conçue pour l’état actuel de votre peau, et un rituel calme et ancré à emporter chez vous.',
  ],
  flowTitle: 'Le déroulé de l’expérience',
  sep: ' :',
  steps: [
    { title: 'La conférence « Culture de la peau »', text: 'comprenez le dialogue discret entre votre barrière cutanée, votre pH, votre système nerveux et votre rythme quotidien, expliqué clairement, sans jargon ni bruit commercial.' },
    { title: 'Diagnostic de peau en direct', text: 'réalisez un bilan guidé de 3 minutes pour découvrir ce que votre peau réclame dans son état actuel.' },
    { title: 'Cartographie personnelle des points d’acupression du visage', text: 'repérez les points de tension et de drainage propres à votre visage sur votre carte illustrée.' },
    { title: 'Formulation botanique sur mesure', text: 'composez votre propre huile faciale en roll-on de 10 ml, à partir d’extraits botaniques purs adaptés à votre profil diagnostique.' },
    { title: 'Détente sensorielle guidée et rituel à emporter', text: 'profitez d’une brume faciale réparatrice et d’une séquence de relâchement par acupression, avant de repartir avec votre roll-on personnalisé, votre carte du visage et une pochette de démarrage Vairutya.' },
  ],
  notes: [
    'Durée : 90 minutes',
    'Format : expérience intime en petit groupe (places limitées)',
    'Villes de la tournée : Ahmedabad • Arabie saoudite • Paris',
  ],
};

const line = (c: Copy, s: Step) => `**${s.title}${c.sep}** ${s.text}`;

const toData = (c: Copy) => ({
  title: c.title,
  category: c.category,
  description: c.description,
  schedule: c.schedule,
  ctaLabel: c.ctaLabel,
  durationLabel: c.durationLabel,
  about: c.intro.join('\n\n'),
  menuTitle: c.flowTitle,
  menu: c.steps.map((s) => ({ text: line(c, s) })),
  notes: c.notes.map((text) => ({ text })),
});

/** How the first version of this workshop stored the flow: inside the About text. Used to recognise an unedited copy. */
const legacyAbout = (c: Copy) =>
  [...c.intro, c.flowTitle, ...c.steps.map((s, i) => `${i + 1}. ${s.title}${c.sep} ${s.text}`)].join('\n\n');

/**
 * An earlier version put the five steps inside the About text. If that copy is still exactly as it was created
 * (nobody edited it), move the steps into the numbered list. Anything you have edited is left alone.
 */
async function moveFlowIntoList(strapi: Core.Strapi, docs: any) {
  const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'workshop-skin-flow-moved' });
  if (await store.get()) return;
  for (const [locale, copy] of [['en', ENGLISH], ['fr', FRENCH]] as const) {
    const entry = await docs.findFirst({ filters: { slug: SLUG }, locale }).catch(() => null);
    if (!entry || entry.about !== legacyAbout(copy)) continue;
    await docs.update({
      documentId: entry.documentId,
      locale,
      data: { about: copy.intro.join('\n\n'), menuTitle: copy.flowTitle, menu: copy.steps.map((s) => ({ text: line(copy, s) })), ...(locale === 'en' ? { menuNumbered: true } : {}) },
    });
    strapi.log.info(`[workshop] moved the Skin Masterclass experience flow into its numbered list (${locale}). If it was already published, press Publish again.`);
  }
  await store.set({ value: true });
}

/**
 * Creates the Skin Masterclass workshop once, as a DRAFT. It has no price, photo or dates yet (none were given):
 * add them in Content Manager → Workshop, then press Publish on the English entry.
 * The French version is already published, so it goes live in French at the same moment.
 */
async function createSkinWorkshop(strapi: Core.Strapi) {
  try {
    const docs = (strapi as any).documents(UID);
    await moveFlowIntoList(strapi, docs);

    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'workshop-skin-masterclass-seeded' });
    if (await store.get()) return;

    if (await docs.findFirst({ filters: { slug: SLUG } })) {
      await store.set({ value: true });
      return; // already there: leave your edits alone
    }

    const created = await docs.create({ locale: 'en', status: 'draft', data: { ...toData(ENGLISH), menuNumbered: true, slug: SLUG } });
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

/**
 * The Skin Masterclass runs in two time slots a day and sells two passes. Added once, only if you haven't set any yet:
 * edit or remove them any time in Content Manager → Workshop → Healthy, Happy Skin. The workshop's dates are still yours to add.
 */
async function addSkinSlotsAndPasses(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'workshop-skin-slots-passes-seeded' });
    if (await store.get()) return;
    const docs = (strapi as any).documents(UID);
    const entry = await docs.findFirst({ filters: { slug: SLUG }, locale: 'en', status: 'draft', populate: ['slots', 'passes'] });
    if (!entry) return; // not created yet: try again at the next start
    if (!(entry.slots?.length) && !(entry.passes?.length)) {
      await docs.update({
        documentId: entry.documentId,
        locale: 'en',
        data: {
          slots: [
            { label: '10:00 AM – 12:00 PM', value: 'morning' },
            { label: '2:00 PM – 4:00 PM', value: 'afternoon' },
          ],
          passes: [
            { label: 'Single seat', labelFr: 'Place individuelle', value: 'single', seats: 1, priceInr: 1499 },
            { label: 'Duo pass', labelFr: 'Pass duo', value: 'duo', seats: 2, priceInr: 2499 },
          ],
        },
      });
      strapi.log.info('[workshop] added the two time slots and the Single seat (₹1,499) / Duo pass (₹2,499) to the Skin Masterclass. Add the dates, then press Publish (again, if it was already published).');
    }
    await store.set({ value: true });
  } catch (err) {
    strapi.log.error(`[workshop] could not add the Skin Masterclass slots and passes: ${(err as Error).message}`);
  }
}

export async function seedSkinWorkshop(strapi: Core.Strapi) {
  await createSkinWorkshop(strapi);
  await addSkinSlotsAndPasses(strapi);
}
