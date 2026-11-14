import type { Core } from '@strapi/strapi';

const SUGGESTIONS = [
  { name: 'Healthy Hair Ayurveda', description: 'Your Personalized Ayurvedic Hair Consultation.', buttonLabel: 'Shop Now', link: '/shop', highlighted: true },
  { name: 'Digestion Reset', description: 'Your Personalized Ayurvedic Consultation for Digestive Rebalancing.', buttonLabel: 'Learn More', link: '/consultation', highlighted: false },
  { name: 'Guided Full Assessment', description: 'The Signature Ayurvedic Journey.', buttonLabel: 'Explore', link: '/quiz', highlighted: false },
];

const answers = (vata: string, pitta: string, kapha: string) => [
  { text: vata, outcomeName: 'Vata' },
  { text: pitta, outcomeName: 'Pitta' },
  { text: kapha, outcomeName: 'Kapha' },
];

/** Creates the starter Hair Dosha quiz once. Deleting it later is permanent. */
export async function seedQuizzes(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'quiz-seeded' });
    if (await store.get()) return;

    const docs = (strapi as any).documents('api::quiz.quiz');
    if ((await docs.count({})) === 0) {
      await docs.create({
        status: 'published',
        data: {
          title: 'Hair Dosha Quiz',
          slug: 'hair-dosha',
          description:
            'Discover your Ayurvedic hair type and unlock personalised care rituals aligned with your unique constitution.',
          icon: 'help',
          resultTitle: 'Your Ayurvedic Hair Type',
          profileTitle: 'Your Hair Profile',
          balanceTitle: 'Your Dosha Balance',
          questions: [
            {
              prompt: 'What is the natural texture of your hair (without styling or treatment)?',
              answers: answers(
                'Dry, frizzy, fine strands',
                'Oily at roots, straight or limp',
                'Thick, wavy or curly, voluminous'
              ),
            },
            {
              prompt: 'What best describes your current hair concerns?',
              answers: answers(
                'Hair fall, premature greying, dullness',
                'Greasiness, dandruff, clogged follicles',
                'Frizz, split ends, hair breakage'
              ),
            },
            {
              prompt: 'How does your body respond to stress or seasonal changes?',
              answers: answers(
                'Anxiety, sleep issues, digestive irregularity',
                'Skin breakouts, excess heat, acidity',
                'Heaviness, sluggishness, water retention'
              ),
            },
          ],
          outcomes: [
            {
              name: 'Vata',
              headline: 'Vata Hair',
              emoji: '🌬️',
              color: '#7ca9d4',
              description: 'Dry, thin, and prone to frizz. Tends toward split ends, hair fall, and premature greying when imbalanced.',
              tips: 'Care Tips: Warm nourishing oils (sesame, almond), weekly deep conditioning, avoid over-washing, protect from wind and cold.',
              products: SUGGESTIONS,
            },
            {
              name: 'Pitta',
              headline: 'Pitta Hair',
              emoji: '🔥',
              color: '#e07b3a',
              description: 'Sharp, reactive, quick to heat up. Oiliness, sensitivity, early thinning, scalp issues like dandruff or redness.',
              tips: 'Care Tips: Cooling oils (coconut, amla), mild herbal shampoo, wash every 1–2 days, avoid heat tools and direct sun exposure.',
              products: SUGGESTIONS,
            },
            {
              name: 'Kapha',
              headline: 'Kapha Hair',
              emoji: '🌿',
              color: '#6aab7e',
              description: 'Thick, heavy, and lustrous. Prone to excess oiliness, clogged follicles, and sluggish growth when imbalanced.',
              tips: 'Care Tips: Light oils (neem, brahmi), frequent cleansing, stimulating scalp massage, avoid heavy conditioners.',
              products: SUGGESTIONS,
            },
          ],
        },
      });
      strapi.log.info('[quiz] created the starter Hair Dosha quiz');
    }
    await store.set({ value: true });
  } catch (err) {
    strapi.log.error(`[quiz] could not create the starter quiz: ${(err as Error).message}`);
  }
}
