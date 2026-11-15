import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const UID = 'api::quiz.quiz';
const NAMES = ['Vata', 'Pitta', 'Kapha']; // answer A, B, C
const OUTCOMES = [
  { name: 'Vata', headline: 'Vata', emoji: '🌬️', color: '#7ca9d4' },
  { name: 'Pitta', headline: 'Pitta', emoji: '🔥', color: '#e07b3a' },
  { name: 'Kapha', headline: 'Kapha', emoji: '🌿', color: '#6aab7e' },
];
type Lang = 'en' | 'fr';

const PRODUCTS: Record<Lang, any[]> = {
  en: [
    { name: 'Personalised consultation', description: 'A 1-on-1 session that turns your result into a plan made for you.', buttonLabel: 'Book now', link: '/consultation', highlighted: true },
    { name: 'Shop the essentials', description: 'Handcrafted tools and essentials rooted in Ayurveda.', buttonLabel: 'Shop now', link: '/shop', highlighted: false },
    { name: 'Join a workshop', description: 'Guided, hands-on sessions rooted in Ayurveda and modern wellness.', buttonLabel: 'Explore', link: '/workshops', highlighted: false },
  ],
  fr: [
    { name: 'Consultation personnalisée', description: 'Une séance individuelle pour transformer votre résultat en un plan fait pour vous.', buttonLabel: 'Réserver', link: '/consultation', highlighted: true },
    { name: 'Découvrir la boutique', description: 'Des essentiels artisanaux ancrés dans l’Ayurveda.', buttonLabel: 'Acheter', link: '/shop', highlighted: false },
    { name: 'Rejoindre un atelier', description: 'Des expériences guidées, ancrées dans l’Ayurveda et le bien-être moderne.', buttonLabel: 'Explorer', link: '/workshops', highlighted: false },
  ],
};

const questionsFor = (q: any, l: Lang) =>
  q.questions.map((x: any) => ({
    prompt: x[l].prompt,
    answers: x[l].answers.map((text: string, i: number) => ({ text, outcomeName: NAMES[i] })),
  }));

const resultsFor = (q: any, l: Lang, withProducts: boolean) =>
  q.results.map((r: any) => ({
    matches: r.matches,
    headline: r[l].headline,
    description: r[l].description,
    sections: r[l].sections,
    ...(withProducts ? { products: PRODUCTS[l] } : {}),
  }));

const meta = (q: any, l: Lang) => ({
  title: q[l].title,
  description: q[l].description,
  instructions: q[l].instructions,
  resultTitle: q[l].resultTitle,
  profileTitle: q[l].profileTitle,
  balanceTitle: q[l].balanceTitle,
  questions: questionsFor(q, l),
  outcomes: OUTCOMES,
  results: resultsFor(q, l, true),
});

/** Creates the new quizzes (English + French) from data/quizzes.json once, and adds results to the Hair quiz. */
export async function seedMoreQuizzes(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'quizzes-2-seeded' });
    if (await store.get()) return;

    const root = (strapi as any).dirs?.app?.root ?? process.cwd();
    const file = path.join(root, 'data', 'quizzes.json');
    if (!fs.existsSync(file)) {
      strapi.log.warn('[quiz] data/quizzes.json not found, nothing seeded');
      return;
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const docs = (strapi as any).documents(UID);
    let ok = true;

    for (const q of data.quizzes) {
      try {
        const en = await docs.findFirst({ locale: 'en', filters: { slug: q.slug }, populate: { results: true } });

        if (q.existing) {
          if (!en) continue;
          if (!en.results?.length) {
            await docs.update({ documentId: en.documentId, locale: 'en', data: { slug: q.slug, results: resultsFor(q, 'en', false) } });
            await docs.publish({ documentId: en.documentId, locale: 'en' });
          }
          const fr = await docs.findOne({ documentId: en.documentId, locale: 'fr', populate: { results: true } });
          if (fr && !fr.results?.length) {
            await docs.update({ documentId: en.documentId, locale: 'fr', data: { slug: q.slug, results: resultsFor(q, 'fr', false) } });
            await docs.publish({ documentId: en.documentId, locale: 'fr' });
          }
          strapi.log.info(`[quiz] added the results to "${q.slug}"`);
          continue;
        }

        if (en) continue; // already there: leave your edits alone
        const created = await docs.create({
          locale: 'en',
          status: 'published',
          data: { slug: q.slug, icon: q.icon, ...meta(q, 'en') },
        });
        await docs.update({ documentId: created.documentId, locale: 'fr', data: { slug: q.slug, ...meta(q, 'fr') } });
        await docs.publish({ documentId: created.documentId, locale: 'fr' });
        strapi.log.info(`[quiz] created "${q.slug}" (English and French)`);
      } catch (err) {
        ok = false;
        strapi.log.warn(`[quiz] could not seed "${q.slug}": ${(err as Error).message}`);
      }
    }
    if (ok) await store.set({ value: true });
  } catch (err) {
    strapi.log.error(`[quiz] seeding failed: ${(err as Error).message}`);
  }
}
