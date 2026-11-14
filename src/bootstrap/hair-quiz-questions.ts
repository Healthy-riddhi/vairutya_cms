import type { Core } from '@strapi/strapi';

const UID = 'api::quiz.quiz';
const SLUG = 'hair-dosha';
const NAMES = ['Vata', 'Pitta', 'Kapha']; // answer a), b), c)

type Q = { prompt: string; answers: [string, string, string] };

const EN: Q[] = [
  { prompt: 'What is the natural texture of your hair (without styling or treatment)?',
    answers: ['Dry, frizzy, fine strands', 'Oily at roots, straight or limp', 'Thick, wavy or curly, voluminous'] },
  { prompt: 'How does your scalp typically feel by the end of the day?',
    answers: ['Dry or flaky, especially in cold weather', 'Greasy or sweaty, needs frequent washing', 'Balanced, but sometimes itchy or prone to buildup'] },
  { prompt: 'What best describes your current hair concerns?',
    answers: ['Hair fall, premature greying, dullness', 'Greasiness, dandruff, clogged follicles', 'Frizz, split ends, hair breakage'] },
  { prompt: 'How does your body respond to stress or seasonal changes?',
    answers: ['Anxiety, sleep issues, digestive irregularity', 'Skin breakouts, excess heat, acidity', 'Heaviness, sluggishness, water retention'] },
  { prompt: 'What is your scalp’s reaction to oiling or hair masks?',
    answers: ['Soaks up oil quickly; feels nourished', 'Gets oily too fast; can feel clogged', 'Needs moderate oil; feels relaxed afterward'] },
  { prompt: 'How often do you feel the need to wash your hair?',
    answers: ['Every 3–4 days — doesn’t get oily fast', 'Every 1–2 days — scalp feels greasy', 'Every 2–3 days — depends on weather'] },
  { prompt: 'Which best describes your lifestyle?',
    answers: ['Fast-paced, irregular routines, creative but scattered', 'Intense, perfectionist, always on-the-go', 'Stable, grounded, prefers comfort and routine'] },
  { prompt: 'How does your hair respond to humidity or heat?',
    answers: ['Becomes frizzy, dry, unmanageable', 'Becomes flat, greasy, sweaty', 'Swells, becomes dense or heavy'] },
  { prompt: 'What kind of hair products or rituals do you feel drawn to intuitively?',
    answers: ['Nourishing oils, warm herbal rinses, calming aromas', 'Clarifying shampoos, cooling tonics, lightweight masks', 'Strengthening packs, scalp massages, balancing herbs'] },
  { prompt: 'In which season does your hair feel the happiest and healthiest?',
    answers: ['Autumn or early winter', 'Summer or late spring', 'Monsoon or early spring'] },
];

const FR: Q[] = [
  { prompt: 'Quelle est la texture naturelle de vos cheveux (sans coiffage ni traitement) ?',
    answers: ['Secs, frisottants, fins', 'Gras aux racines, raides ou plats', 'Épais, ondulés ou bouclés, volumineux'] },
  { prompt: 'Comment votre cuir chevelu se sent-il généralement en fin de journée ?',
    answers: ['Sec ou qui pèle, surtout par temps froid', 'Gras ou moite, nécessite des lavages fréquents', 'Plutôt équilibré, mais parfois sujet à des démangeaisons ou des résidus'] },
  { prompt: 'Quelles sont vos principales préoccupations capillaires actuellement ?',
    answers: ['Chute de cheveux, cheveux blancs précoces, manque d’éclat', 'Excès de sébum, pellicules, racines obstruées', 'Frisottis, pointes fourchues, casse'] },
  { prompt: 'Comment votre corps réagit-il au stress ou aux changements de saison ?',
    answers: ['Anxiété, troubles du sommeil, digestion irrégulière', 'Boutons, bouffées de chaleur, acidité', 'Lenteur, sensation de lourdeur, rétention d’eau'] },
  { prompt: 'Quelle est la réaction de votre cuir chevelu aux huiles ou aux masques capillaires ?',
    answers: ['Absorbe rapidement l’huile, se sent nourri', 'Devient trop gras, sensation d’encombrement', 'Apprécie une quantité modérée, sensation de détente'] },
  { prompt: 'À quelle fréquence ressentez-vous le besoin de laver vos cheveux ?',
    answers: ['Tous les 3 à 4 jours – ils ne graissent pas vite', 'Tous les 1 à 2 jours – le cuir chevelu devient rapidement gras', 'Tous les 2 à 3 jours – cela dépend de la météo'] },
  { prompt: 'Quel style de vie vous correspond le mieux ?',
    answers: ['Rythme rapide, routines irrégulières, créatif·ve mais dispersé·e', 'Intense, perfectionniste, toujours en mouvement', 'Stable, posé·e, adepte de confort et de régularité'] },
  { prompt: 'Comment vos cheveux réagissent-ils à la chaleur ou à l’humidité ?',
    answers: ['Devenus secs, frisottants, difficiles à dompter', 'Plats, gras, transpirants', 'Lourds, denses, gonflés'] },
  { prompt: 'Vers quels types de produits ou rituels capillaires êtes-vous naturellement attiré·e ?',
    answers: ['Huiles nourrissantes, rinçages aux plantes chaudes, arômes apaisants', 'Shampoings purifiants, toniques rafraîchissants, masques légers', 'Soins fortifiants, massages du cuir chevelu, herbes équilibrantes'] },
  { prompt: 'Durant quelle saison vos cheveux sont-ils les plus beaux et en meilleure santé ?',
    answers: ['Automne ou début d’hiver', 'Été ou fin de printemps', 'Saison des pluies ou début du printemps'] },
];

const toComponent = (qs: Q[]) =>
  qs.map((q) => ({
    prompt: q.prompt,
    answers: q.answers.map((text, i) => ({ text, outcomeName: NAMES[i] })),
  }));

/**
 * Loads the full 10-question Hair Dosha quiz (English + French) once.
 * Only touches a language whose quiz still has fewer than 10 questions,
 * so anything you have edited in the admin panel is left alone.
 */
export async function seedHairQuizQuestions(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'hair-quiz-10-questions' });
    if (await store.get()) return;

    const docs = (strapi as any).documents(UID);
    const en = await docs.findFirst({ locale: 'en', filters: { slug: SLUG }, populate: { questions: true } });
    if (!en) {
      strapi.log.warn(`[quiz] "${SLUG}" not found, hair questions not loaded`);
      return;
    }

    let ok = true;
    const langs: [string, Q[]][] = [['en', EN], ['fr', FR]];
    for (const [locale, qs] of langs) {
      try {
        const current =
          locale === 'en'
            ? en
            : await docs.findOne({ documentId: en.documentId, locale, populate: { questions: true } });
        if (current && (current.questions?.length ?? 0) >= qs.length) continue;
        await docs.update({ documentId: en.documentId, locale, data: { questions: toComponent(qs) } });
        await docs.publish({ documentId: en.documentId, locale });
        strapi.log.info(`[quiz] loaded ${qs.length} hair quiz questions (${locale})`);
      } catch (err) {
        ok = false;
        strapi.log.warn(`[quiz] could not load hair questions (${locale}): ${(err as Error).message}`);
      }
    }
    if (ok) await store.set({ value: true });
  } catch (err) {
    strapi.log.error(`[quiz] hair question load failed: ${(err as Error).message}`);
  }
}
