import type { Core } from '@strapi/strapi';

/** Creates a French version of one entry, only if it doesn't exist yet. */
async function addFrench(strapi: Core.Strapi, uid: string, slug: string, data: Record<string, unknown>, label: string) {
  try {
    const docs = (strapi as any).documents(uid);
    const en = await docs.findFirst({ locale: 'en', filters: { slug } });
    if (!en) return;
    if (await docs.findOne({ documentId: en.documentId, locale: 'fr' })) return;
    await docs.update({ documentId: en.documentId, locale: 'fr', data: { slug, ...data } });
    await docs.publish({ documentId: en.documentId, locale: 'fr' });
    strapi.log.info(`[french] added French for ${label}`);
  } catch (err) {
    strapi.log.warn(`[french] could not add French for ${label}: ${(err as Error).message}`);
  }
}

export async function seedFrenchRecipesAndWorkshops(strapi: Core.Strapi) {
  await addFrench(strapi, 'api::recipe.recipe', 'blueberry-nutri-jar', {
    title: 'Pot Nutri aux myrtilles',
    tag: 'PETIT-DÉJEUNER · DÉBUTANT',
    description: 'Un pot nourrissant en couches, garni de myrtilles, de granola et de yaourt onctueux, prêt en 4 minutes.',
    time: '4 min · 1 portion',
    stats: [
      { label: 'PORTIONS : 1', bold: true },
      { label: '🕒 TEMPS TOTAL : 4 MIN', bold: false },
      { label: 'PRÉPARATION : 3 MIN', bold: false },
      { label: 'ASSEMBLAGE : 1 MIN', bold: false },
    ],
  }, 'the Blueberry Nutri Jar');

  await addFrench(strapi, 'api::recipe.recipe', 'rebel-avocado-toast', {
    title: 'Le Toast Rebelle à l’avocat',
    tag: 'PETIT-DÉJEUNER · DÉBUTANT',
    description: 'Galettes croustillantes de patate douce et de carotte, congelées pour les raffermir puis poêlées, couronnées d’une rose d’avocat écrasé sur du pain au levain. Un petit-déjeuner nourrissant qui équilibre Vata et Pitta.',
    time: '~1 h · 2 portions',
    stats: [
      { label: 'PORTIONS : 2', bold: true },
      { label: '🕒 TEMPS TOTAL : ~1 H', bold: false },
      { label: 'CUISSON : 15 MIN', bold: false },
      { label: 'CONGÉLATION : 20 MIN', bold: false },
      { label: 'PRÉPARATION : 25 MIN', bold: false },
    ],
  }, 'the Rebel Avocado Toast');

  await addFrench(strapi, 'api::workshop.workshop', 'healthy-vegetarian-cooking', {
    title: 'L’atelier de cuisine végétarienne saine',
    category: 'Nutrition et cuisine',
    description: 'Découvrez les fondements d’une cuisine végétarienne saine et savoureuse. Apprenez à cuisiner simplement et à intégrer durablement une alimentation végétale à votre quotidien.',
    schedule: 'Vendredi 29 mai',
    ctaLabel: 'S’inscrire',
    durationLabel: '2 h 30',
    priceLabel: '125,00 €',
    about: 'Cet atelier vous invite à explorer les fondements d’une cuisine végétarienne saine, savoureuse et équilibrée. À travers des recettes gourmandes et accessibles, vous apprendrez à cuisiner simplement et à intégrer durablement une alimentation végétale à votre quotidien, sans complexité ni confusion.\n\nDans un cadre convivial et entièrement équipé, chaque participant prépare une première recette de A à Z à son propre poste de travail, guidé par une approche structurée et progressive. Une seconde préparation est ensuite réalisée par Riddhi Shah, qui montre une autre application du même système culinaire.\n\nVous repartez avec les deux créations, prêtes à être dégustées ou partagées avec vos proches. Un tablier et un sac isotherme sont également fournis.',
    menu: [
      { text: 'Bol réconfort aux lentilles fondantes, riz parfumé et légumes de saison' },
      { text: 'Curry doré végétarien aux épices douces' },
      { text: 'Yaourt rouge rubis' },
      { text: 'Herbes grillées croustillantes' },
      { text: 'Noix grillées enrobées de chocolat' },
      { text: 'Pain artisanal' },
    ],
    notes: [
      { text: 'Cet atelier est animé en français, avec traduction consécutive en anglais, en hindi ou en gujarati sur demande.' },
      { text: 'La participation est réservée aux adultes de 18 ans et plus.' },
    ],
    dates: [
      { label: 'Vendredi 29 mai', value: 'may29' },
      { label: 'Mardi 16 juin', value: 'jun16' },
      { label: 'Samedi 27 juin', value: 'jun27' },
      { label: 'Mercredi 1er juillet', value: 'jul1' },
    ],
  }, 'the Healthy Vegetarian Cooking Workshop');

  await addFrench(strapi, 'api::workshop.workshop', 'healthy-happy-hair', {
    title: 'Cheveux sains, cheveux heureux',
    category: 'Cheveux et Ayurveda',
    description: 'Comprenez les véritables causes du déséquilibre capillaire grâce à la sagesse ayurvédique et à la science moderne. Construisez des rituels durables, adaptés à votre constitution unique.',
    schedule: 'Lundi 8 juin',
    ctaLabel: 'S’inscrire',
    durationLabel: '1 h 30',
    priceLabel: '85,00 €',
    about: 'Comprenez les véritables causes du déséquilibre capillaire grâce à la sagesse ayurvédique et à la science moderne. Cet atelier vous guide à travers les deux approches côte à côte, pour voir comment la digestion, le stress et le rythme circadien se manifestent dans vos cheveux.\n\nVous repartez avec une compréhension personnalisée des signaux biologiques de vos cheveux, ainsi qu’un rituel simple et durable à adopter dès le jour même.',
    notes: [
      { text: 'Cet atelier est animé en anglais.' },
      { text: 'La participation est réservée aux adultes de 18 ans et plus.' },
    ],
    dates: [
      { label: 'Lundi 8 juin', value: 'jun8' },
      { label: 'Jeudi 25 juin', value: 'jun25' },
    ],
  }, 'the Healthy Happy Hair Workshop');
}
