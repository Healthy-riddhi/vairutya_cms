import type { Core } from '@strapi/strapi';

const UID = 'api::consultation-page.consultation-page';

/** Adds a French Consultation Page once. If one already exists, it is left alone. */
export async function seedFrenchConsultation(strapi: Core.Strapi) {
  try {
    const docs = (strapi as any).documents(UID);
    const en = await docs.findFirst({ locale: 'en' });
    if (!en) return;
    if (await docs.findOne({ documentId: en.documentId, locale: 'fr' })) return;

    await docs.update({
      documentId: en.documentId,
      locale: 'fr',
      data: {
        headline: 'Trouvez votre clarté. Construisez votre rythme naturel.',
        intro:
          'Votre routine et votre parcours de santé ne devraient jamais être un fardeau ni une source de pression, car dans ce cas, ils ne vous aideront tout simplement pas. Fatigué(e) du bruit incessant du bien-être, des règles rigides et de l’anxiété des solutions miracles ? Respirez. Votre parcours de santé personnel commence ici, pensé autour de qui vous êtes réellement.',
        primaryCta: 'Réserver votre consultation',
        helpTitle: 'Comment nous vous aidons à vous épanouir',
        helpBody:
          'Nous ne prétendons pas vous dire comment vivre. Le bien-être doit être accueillant, pas intimidant, et la santé n’a jamais été faite pour devenir une source de pression supplémentaire.\n\nUn véritable accompagnement doit renforcer votre confiance, pas créer de dépendance. Dans un monde plein d’opinions contradictoires, nos séances individuelles dissipent la confusion pour vous aider à comprendre votre propre corps, à vous aligner sur votre rythme naturel et à faire vos choix en toute intention.',
        journeyTitle: 'Votre parcours personnalisé',
        journeySteps: [
          {
            title: 'L’appel découverte',
            description:
              'Réservez votre rendez-vous et échangez avec nous lors d’un appel audio ou vidéo flexible. Nous explorons en profondeur vos besoins, votre mode de vie et vos objectifs, sans aucun jugement.',
          },
          {
            title: 'Le plan sur mesure (3 à 5 jours)',
            description:
              'Votre parcours étant entièrement unique, nos experts prennent 3 à 5 jours ouvrés après l’appel pour élaborer avec soin un protocole personnalisé rien que pour vous.',
          },
          {
            title: 'Une mise en pratique consciente',
            description:
              'Nous introduisons des ajustements simples et durables dans votre quotidien et vos habitudes alimentaires, pour vous aider à atteindre vos objectifs de santé naturellement, sans épuisement.',
          },
        ],
        includedTitle: 'Ce que comprend votre expérience',
        includedIntro:
          'Recevez une boîte à outils complète et concrète, adaptée à votre corps et à votre mode de vie :',
        includedItems: [
          {
            title: 'Évaluation de votre constitution (Prakriti) et plan de vie (PDF)',
            description:
              'Des conseils sur mesure, avec la Dinacharya (routines du jour) et la Ratricharya (routines du soir), pour ancrer vos journées sans effort.',
          },
          {
            title: 'Plan de repas personnalisé sur 7 jours (PDF)',
            description:
              'Des choix alimentaires nourrissants et réalistes, adaptés à votre constitution et à vos objectifs, pour des repas agréables plutôt que restrictifs.',
          },
          {
            title: 'Programme de mouvement sur 7 jours',
            description:
              'Une routine guidée de yoga, de méditation et de mouvement, pensée pour soutenir votre énergie sans devenir une corvée punitive.',
          },
          {
            title: '3 séances au total',
            description:
              'Un accompagnement complet sur trois séances dédiées (la première étant votre consultation initiale) pour suivre vos progrès et affiner votre parcours à un rythme confortable.',
          },
        ],
        closingTitle: 'Prêt(e) à remplacer la confusion par la clarté ?',
        closingBody:
          'Adoptez un mode de vie cultivé par de petits choix conscients, répétés avec soin.',
        secondaryCta: 'Réserver ma place',
      },
    });
    await docs.publish({ documentId: en.documentId, locale: 'fr' });
    strapi.log.info('[french] added French for the Consultation Page');
  } catch (err) {
    strapi.log.warn(`[french] could not add French for the Consultation Page: ${(err as Error).message}`);
  }
}
