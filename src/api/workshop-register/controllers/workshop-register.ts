const REG = 'api::workshop-registration.workshop-registration';
const WORKSHOP = 'api::workshop.workshop';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default {
  /**
   * Saves one registration. The workshop and the date are checked here against what is published in Strapi,
   * so only real workshops and real dates can be registered for.
   */
  async create(ctx: any) {
    const b = ctx.request.body ?? {};
    const slug = str(b.slug, 120);
    const dateValue = str(b.dateValue, 60);
    const name = str(b.name, 80);
    const email = str(b.email, 254).toLowerCase();
    const phone = str(b.phone, 40);
    const note = str(b.note, 1000);
    const language = b.language === 'fr' ? 'fr' : 'en';

    if (!slug || !dateValue || !name || !phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ctx.badRequest('invalid');

    // English is the base entry. Its published version holds the dates people can pick.
    const workshop: any = await (strapi as any).documents(WORKSHOP).findFirst({
      filters: { slug },
      locale: 'en',
      status: 'published',
      populate: ['dates'],
    });
    if (!workshop) return ctx.notFound();
    const date = (workshop.dates ?? []).find((d: any) => d.value === dateValue);
    if (!date) {
      ctx.status = 409;
      ctx.body = { error: 'date_unavailable' };
      return;
    }

    // The same person registering twice for the same date: keep one registration
    const dup: any = await strapi.db.query(REG).findOne({ where: { email, workshopSlug: slug, dateValue } });
    if (dup) {
      ctx.body = { reference: dup.reference, workshopTitle: dup.workshopTitle, dateLabel: dup.dateLabel, duplicate: true };
      return;
    }

    const created: any = await strapi.db.query(REG).create({
      data: {
        registrationStatus: 'new',
        workshopTitle: workshop.title,
        workshopSlug: slug,
        dateLabel: date.label,
        dateValue,
        name, email, phone, note, language,
      },
    });
    const reference = `WR-${String(created.id).padStart(5, '0')}`;
    await strapi.db.query(REG).update({ where: { id: created.id }, data: { reference } });
    ctx.body = { reference, workshopTitle: workshop.title, dateLabel: date.label, duplicate: false };
  },
};
