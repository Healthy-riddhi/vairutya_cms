import type { Core } from '@strapi/strapi';

export type FrSection = { heading?: string; body: string; caption?: string };
export type FrArticle = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  sections: FrSection[];
};

/** Creates the French version of an article once. Images are copied from the English sections. */
export async function addFrenchArticle(strapi: Core.Strapi, a: FrArticle) {
  const UID = 'api::article.article';
  try {
    const docs = (strapi as any).documents(UID);
    const en = await docs.findFirst({
      locale: 'en',
      filters: { slug: a.slug },
      populate: { sections: { populate: 'image' } },
    });
    if (!en) return;
    if (await docs.findOne({ documentId: en.documentId, locale: 'fr' })) return;

    const enSections: any[] = en.sections ?? [];
    if (enSections.length !== a.sections.length) {
      strapi.log.warn(
        `[french] ${a.slug}: English has ${enSections.length} sections, French has ${a.sections.length}. Images are matched by position.`
      );
    }

    await docs.update({
      documentId: en.documentId,
      locale: 'fr',
      data: {
        slug: a.slug,
        title: a.title,
        category: a.category,
        excerpt: a.excerpt,
        ctaTitle: a.ctaTitle,
        ctaBody: a.ctaBody,
        ctaButton: a.ctaButton,
        ctaHref: en.ctaHref,
        sections: a.sections.map((s, i) => ({
          ...(s.heading ? { heading: s.heading } : {}),
          body: s.body,
          ...(s.caption ? { caption: s.caption } : {}),
          ...(enSections[i]?.image?.id ? { image: enSections[i].image.id } : {}),
        })),
      },
    });
    await docs.publish({ documentId: en.documentId, locale: 'fr' });
    strapi.log.info(`[french] added French for the article "${a.slug}"`);
  } catch (err) {
    strapi.log.warn(`[french] could not add French for the article "${a.slug}": ${(err as Error).message}`);
  }
}
