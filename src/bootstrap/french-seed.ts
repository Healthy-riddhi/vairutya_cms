import type { Core } from '@strapi/strapi';

const answers = (a: string, b: string, c: string) => [
  { text: a, outcomeName: 'Vata' },
  { text: b, outcomeName: 'Pitta' },
  { text: c, outcomeName: 'Kapha' },
];

const PRODUCTS = [
  { name: 'Cheveux sains, Ayurveda', description: 'Votre consultation capillaire ayurvédique personnalisée.', buttonLabel: 'Acheter', link: '/shop', highlighted: true },
  { name: 'Rééquilibrage digestif', description: 'Votre consultation ayurvédique personnalisée pour rééquilibrer la digestion.', buttonLabel: 'En savoir plus', link: '/consultation', highlighted: false },
  { name: 'Rejoindre un atelier', description: 'Des expériences guidées, ancrées dans l’Ayurveda et le bien-être moderne.', buttonLabel: 'Explorer', link: '/workshops', highlighted: false },
];

/** Creates a French version of one entry, only if it doesn't exist yet. */
async function addFrench(
  strapi: Core.Strapi, uid: string, slug: string, populate: any, build: (en: any) => any, label: string
) {
  try {
    const docs = (strapi as any).documents(uid);
    const en = await docs.findFirst({ locale: 'en', filters: { slug }, populate });
    if (!en) return;
    if (await docs.findOne({ documentId: en.documentId, locale: 'fr' })) return;
    await docs.update({ documentId: en.documentId, locale: 'fr', data: build(en) });
    await docs.publish({ documentId: en.documentId, locale: 'fr' });
    strapi.log.info(`[french] added French for ${label}`);
  } catch (err) {
    strapi.log.warn(`[french] could not add French for ${label}: ${(err as Error).message}`);
  }
}

export async function seedFrench(strapi: Core.Strapi) {
  await addFrench(strapi, 'api::quiz.quiz', 'hair-dosha', undefined, () => ({
    title: 'Quiz Dosha des cheveux',
    description: 'Découvrez votre type de cheveux ayurvédique et accédez à des rituels de soin personnalisés, alignés sur votre constitution unique.',
    resultTitle: 'Votre type de cheveux ayurvédique',
    profileTitle: 'Votre profil capillaire',
    balanceTitle: 'Votre équilibre des doshas',
    questions: [
      { prompt: 'Quelle est la texture naturelle de vos cheveux (sans coiffage ni traitement) ?',
        answers: answers('Secs, frisottés, aux mèches fines', 'Gras à la racine, raides ou plats', 'Épais, ondulés ou bouclés, volumineux') },
      { prompt: 'Qu’est-ce qui décrit le mieux vos préoccupations capillaires actuelles ?',
        answers: answers('Chute de cheveux, grisonnement précoce, manque d’éclat', 'Excès de gras, pellicules, follicules obstrués', 'Frisottis, fourches, casse des cheveux') },
      { prompt: 'Comment votre corps réagit-il au stress ou aux changements de saison ?',
        answers: answers('Anxiété, troubles du sommeil, digestion irrégulière', 'Boutons, sensation de chaleur excessive, acidité', 'Lourdeur, sensation de lenteur, rétention d’eau') },
    ],
    outcomes: [
      { name: 'Vata', headline: 'Cheveux Vata', emoji: '🌬️', color: '#7ca9d4',
        description: 'Secs, fins et sujets aux frisottis. Fourches, chute de cheveux et grisonnement précoce possibles en cas de déséquilibre.',
        tips: 'Conseils de soin : huiles chaudes et nourrissantes (sésame, amande), soin profond hebdomadaire, éviter les shampooings trop fréquents, protéger du vent et du froid.',
        products: PRODUCTS },
      { name: 'Pitta', headline: 'Cheveux Pitta', emoji: '🔥', color: '#e07b3a',
        description: 'Vifs, réactifs, qui s’échauffent vite. Excès de sébum, sensibilité, amincissement précoce, problèmes de cuir chevelu comme pellicules ou rougeurs.',
        tips: 'Conseils de soin : huiles rafraîchissantes (coco, amla), shampooing doux aux plantes, lavage tous les 1 à 2 jours, éviter les outils chauffants et l’exposition directe au soleil.',
        products: PRODUCTS },
      { name: 'Kapha', headline: 'Cheveux Kapha', emoji: '🌿', color: '#6aab7e',
        description: 'Épais, lourds et brillants. Excès de sébum, follicules obstrués et pousse lente possibles en cas de déséquilibre.',
        tips: 'Conseils de soin : huiles légères (neem, brahmi), nettoyage fréquent, massage stimulant du cuir chevelu, éviter les après-shampooings riches.',
        products: PRODUCTS },
    ],
  }), 'the Hair Dosha quiz');

  await addFrench(strapi, 'api::product.product', 'silver-tongue-scraper', { tabs: true }, (en) => {
    const ids: string[] = (en.tabs ?? []).map((t: any) => t.tabId);
    return {
      name: 'Le Gratte-langue en argent',
      description: 'Outil rituel d’hygiène buccale forgé à la main, ancré dans la tradition ayurvédique. Arche ergonomique, délicates poignées torsadées, réalisé dans un alliage d’argent massif de haute qualité.',
      tags: [{ text: 'Forgé à la main' }, { text: 'Alliage d’argent massif' }, { text: 'Rituel ayurvédique' }],
      tabs: [
        { tabId: ids[0] ?? 'design', label: 'Design et philosophie',
          sections: [{ body: 'Ancré dans l’ancienne tradition ayurvédique et repensé pour le rituel moderne, ce gratte-langue transforme l’hygiène buccale quotidienne en une pratique matinale consciente. Forgé à la main, avec une arche ergonomique et de délicates poignées torsadées, il équilibre doucement les sens et purifie le palais.' }],
          noteHeading: 'Avis sur l’artisanat',
          noteBody: 'Chaque pièce étant forgée à la main par des artisans experts, de subtiles variations de détails, de finition et de poids peuvent exister, ce qui rend chaque gratte-langue unique.' },
        { tabId: ids[1] ?? 'material', label: 'Matériau et entretien',
          sections: [
            { heading: 'Composition du matériau et évolution naturelle', body: 'Réalisé dans un alliage d’argent massif de haute qualité, cet outil associe l’argent pur à des métaux traces choisis pour leur solidité et leur longévité. En raison de la nature active de l’alliage, une oxydation et un changement progressif de couleur se produiront naturellement avec le temps au contact de l’air et de l’humidité. Cette patine évolutive est la marque de l’orfèvrerie authentique, elle est sans danger et ne présente aucun risque pour un usage rituel quotidien.' },
            { heading: 'Rangement et entretien', body: 'Pour protéger le métal d’une oxydation prématurée et conserver sa finition plus brillante, il est recommandé de ranger le gratte-langue dans une pochette hermétique ou une housse en plastique lorsqu’il n’est pas utilisé. Rincez-le simplement à l’eau tiède après chaque utilisation et séchez-le en le tapotant.' },
          ] },
        { tabId: ids[2] ?? 'specs', label: 'Caractéristiques',
          specs: [
            { label: 'Dimensions', value: 'Environ 11 cm × 6 cm (contour ergonomique pour une prise en main et une portée optimales)' },
            { label: 'Poids', value: 'Environ 11 g (équilibre ultra-léger pensé pour un usage quotidien aisé et maîtrisé)' },
            { label: 'Matériau', value: 'Alliage d’argent massif de haute qualité' },
            { label: 'Finition', value: 'Forgé à la main, poignées torsadées' },
          ] },
      ],
    };
  }, 'the Silver Tongue Scraper');
}
