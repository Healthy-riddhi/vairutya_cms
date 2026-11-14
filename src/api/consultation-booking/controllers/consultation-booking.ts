import crypto from 'node:crypto';
import { computeDays } from '../../../utils/consultation';

const REQ = 'api::consultation-request.consultation-request';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default {
  async availability(ctx: any) {
    ctx.body = { timezone: 'Asia/Kolkata', days: await computeDays(strapi) };
  },

  /** The slot is checked again here, so nobody can book a time that isn't open. */
  async create(ctx: any) {
    const b = ctx.request.body ?? {};
    const name = str(b.name, 80);
    const email = str(b.email, 254);
    const phone = str(b.phone, 40);
    const concern = str(b.concern, 2000);
    const date = str(b.date, 10);
    const slot = str(b.slot, 5);
    const language = b.language === 'fr' ? 'fr' : 'en';

    if (!name || !phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ctx.badRequest('Invalid request');

    const days = await computeDays(strapi);
    if (!days[date]?.includes(slot)) {
      ctx.status = 409;
      ctx.body = { error: 'slot_unavailable' };
      return;
    }

    // Same person pressing twice: return the request they already made
    const dup: any = await strapi.db.query(REQ).findOne({ where: { email, date, slot, requestStatus: 'requested' } });
    if (dup) {
      ctx.body = { reference: dup.reference, token: dup.token };
      return;
    }

    const token = crypto.randomBytes(16).toString('hex');
    const created: any = await strapi.db.query(REQ).create({
      data: { requestStatus: 'requested', name, email, phone, concern, date, slot, language, token },
    });
    const reference = `CR-${String(created.id).padStart(5, '0')}`;
    await strapi.db.query(REQ).update({ where: { id: created.id }, data: { reference } });
    ctx.body = { reference, token };
  },

  /** What the customer's link may see. The secret token in the link is required. */
  async status(ctx: any) {
    const reference = str(ctx.params.reference, 20);
    const t = str(ctx.query.t, 64);
    const r: any = await strapi.db.query(REQ).findOne({ where: { reference } });
    const ok =
      r && typeof r.token === 'string' && r.token.length === t.length && crypto.timingSafeEqual(Buffer.from(r.token), Buffer.from(t));
    if (!ok) return ctx.notFound();

    const confirmed = r.requestStatus === 'confirmed';
    ctx.body = {
      request: {
        reference: r.reference,
        status: r.requestStatus,
        date: String(r.date).slice(0, 10),
        slot: r.slot,
        firstName: String(r.name ?? '').trim().split(/\s+/)[0] ?? '',
        meetingLink: confirmed ? r.meetingLink || null : null,
        note: confirmed ? r.messageToCustomer || null : null,
      },
    };
  },
};
