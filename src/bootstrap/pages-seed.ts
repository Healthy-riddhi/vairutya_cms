import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const PAGE = 'api::page.page';
const BUSINESS = 'api::business-detail.business-detail';

/** Which page each group of texts belongs to: [name in Strapi, address on the website] */
const PAGES: Record<string, [string, string]> = {
  Meta: ['Site title and description', '/'],
  Header: ['Header', 'every page'],
  Menu: ['Side menu', 'every page'],
  Footer: ['Footer', 'every page'],
  Hero: ['Home: banner text', '/'],
  Home: ['Home: sections', '/'],
  Newsletter: ['Newsletter box', '/'],
  Shop: ['Shop', '/shop'],
  Product: ['Product page', '/shop/…'],
  Cart: ['Cart', '/cart'],
  Checkout: ['Checkout', '/checkout'],
  Orders: ['Orders and order confirmation', '/account/orders'],
  Status: ['Order statuses', '/account/orders'],
  Account: ['My account', '/account'],
  Auth: ['Sign in and passwords', '/login'],
  Contact: ['Contact', '/contact'],
  About: ['About Us', '/about'],
  Careers: ['Careers', '/careers'],
  Science: ['Our Science', '/our-science'],
  Consultation: ['Consultation: booking', '/consultation'],
  ConsultationStatus: ['Consultation: status page', '/consultation/confirmed'],
  Workshops: ['Workshops', '/workshops'],
  Blog: ['Blog', '/blog'],
  Recipes: ['Recipes', '/recipes'],
  Quiz: ['Quizzes', '/quiz'],
  Refund: ['Refund and cancellation', '/refund-policy'],
  Shipping: ['Shipping policy', '/shipping'],
  Pay: ['Payment (UPI)', '/checkout/pay'],
};

/** "links.aboutUs" → "links › About us" */
const labelOf = (key: string) =>
  key
    .split('.')
    .slice(1)
    .map((p) => p.replace(/([a-z])([A-Z0-9])/g, '$1 $2').toLowerCase())
    .join(' › ')
    .replace(/^./, (c) => c.toUpperCase());

/** Builds one Page per group of texts. Adds missing texts, fills empty ones, removes texts the site no longer uses. Never overwrites your edits. */
export async function seedPages(strapi: Core.Strapi) {
  try {
    const root = (strapi as any).dirs?.app?.root ?? process.cwd();
    const file = path.join(root, 'data', 'site-text.json');
    if (!fs.existsSync(file)) return strapi.log.warn('[pages] data/site-text.json not found');
    const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as { key: string; en: string; fr: string }[];

    // Edits made in the old Site Text list, if it still exists
    const old = new Map<string, { en?: string; fr?: string }>();
    try {
      const prev: any[] = await strapi.db.query('api::site-text.site-text').findMany({ select: ['key', 'en', 'fr'], limit: 10000 });
      prev.forEach((r) => old.set(r.key, r));
    } catch {
      /* the old list is already gone */
    }

    const groups = new Map<string, typeof rows>();
    for (const r of rows) {
      const ns = r.key.split('.')[0];
      groups.set(ns, [...(groups.get(ns) ?? []), r]);
    }

    const docs = (strapi as any).documents(PAGE);
    const existing: any[] = await docs.findMany({ populate: { texts: true }, limit: 500 });
    const byName = new Map(existing.map((p) => [p.name, p]));
    let created = 0;
    let updated = 0;

    for (const [ns, list] of groups) {
      const [name, where] = PAGES[ns] ?? [ns, ''];
      const page = byName.get(name);
      const have = new Map<string, any>((page?.texts ?? []).map((t: any) => [t.key, t]));
      const texts = list.map((r) => {
        const cur = have.get(r.key);
        const prev = old.get(r.key);
        return {
          key: r.key,
          label: labelOf(r.key),
          en: cur?.en || prev?.en || r.en,
          fr: cur?.fr || prev?.fr || r.fr,
        };
      });
      try {
        if (!page) {
          await docs.create({ data: { name, path: where, texts } });
          created++;
        } else {
          const same =
            (page.texts ?? []).length === texts.length &&
            texts.every((t, i) => {
              const c = page.texts[i];
              return c && c.key === t.key && c.en === t.en && c.fr === t.fr && c.label === t.label;
            });
          if (!same) {
            await docs.update({ documentId: page.documentId, data: { texts } });
            updated++;
          }
        }
      } catch (e) {
        strapi.log.warn(`[pages] ${name}: ${(e as Error).message}`);
      }
    }
    strapi.log.info(`[pages] ${created} created, ${updated} updated, ${groups.size} total`);

    // Contact and business details: created once, then only you change them
    const biz = (strapi as any).documents(BUSINESS);
    if (!(await biz.findFirst())) {
      await biz.create({
        data: {
          email: 'hello@vairutya.com',
          phone: '+91 00000 00000',
          studio: 'Ahmedabad, Gujarat, India',
          legalName: '',
          registeredAddress: '66 Alkapark, Ahmedabad 380051, India',
          gstin: '',
        },
      });
      strapi.log.info('[pages] created Business Details: set your real phone number there');
    }
  } catch (err) {
    strapi.log.error(`[pages] seeding failed: ${(err as Error).message}`);
  }
}
