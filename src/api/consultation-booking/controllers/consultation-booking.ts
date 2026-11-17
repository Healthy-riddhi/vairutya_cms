import crypto from 'node:crypto';
import { computeDays, getFees } from '../../../utils/consultation';

const REQ = 'api::consultation-request.consultation-request';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const PAID = ['paid'];

/** Constant-time check of the secret token in the customer's link. */
function tokenOk(r: any, t: string) {
  return r && typeof r.token === 'string' && r.token.length === t.length && crypto.timingSafeEqual(Buffer.from(r.token), Buffer.from(t));
}

/** What the customer's link may see. The secret token in the link is required. */
function view(r: any) {
  const confirmed = r.requestStatus === 'confirmed';
  return {
    reference: r.reference,
    token: r.token, // only ever sent to the website's server, never to the browser by this endpoint
    status: r.requestStatus,
    date: String(r.date).slice(0, 10),
    slot: r.slot,
    firstName: String(r.name ?? '').trim().split(/\s+/)[0] ?? '',
    email: r.email,
    name: r.name,
    phone: r.phone,
    language: r.language === 'fr' ? 'fr' : 'en',
    meetingLink: confirmed ? r.meetingLink || null : null,
    note: confirmed ? r.messageToCustomer || null : null,
    // payment (null on requests made before payments existed)
    paymentStatus: r.paymentStatus ?? null,
    paymentMethod: r.paymentMethod ?? null,
    currency: r.currency ?? null,
    amountMinor: r.amountMinor ?? null,
    utr: r.utr ?? null,
    razorpayOrderId: r.razorpayOrderId ?? null,
  };
}

async function byRef(ctx: any) {
  const reference = str(ctx.params.reference, 20);
  const t = str(ctx.query.t ?? ctx.request.body?.token, 64);
  const r: any = await strapi.db.query(REQ).findOne({ where: { reference } });
  return tokenOk(r, t) ? r : null;
}

export default {
  async availability(ctx: any) {
    ctx.body = { timezone: 'Asia/Kolkata', days: await computeDays(strapi), fees: await getFees(strapi) };
  },

  /**
   * The slot is checked again here, so nobody can book a time that isn't open.
   * If a fee is set, the request starts as "pending_payment" and the fee is fixed now.
   */
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

    // The fee is worked out here from Strapi's own settings. The website only says which currency.
    const currency = b.currency === 'EUR' ? 'EUR' : 'INR';
    const fees: any = await getFees(strapi);
    const amountMinor: number = fees[currency] ?? 0;
    const paid = amountMinor > 0;
    const method = b.paymentMethod === 'razorpay' ? 'razorpay' : 'upi_manual';

    const days = await computeDays(strapi);
    // Same person coming back to their own unpaid booking: let them continue it.
    const dup: any = await strapi.db.query(REQ).findOne({
      where: { email, date, slot, requestStatus: 'requested', $or: [{ paymentStatus: { $in: ['pending_payment', 'payment_submitted'] } }, { paymentStatus: null }] },
    });
    if (dup) {
      ctx.body = {
        reference: dup.reference, token: dup.token, payment: dup.paymentStatus ?? null,
        amountMinor: dup.amountMinor ?? null, currency: dup.currency ?? null,
      };
      return;
    }
    if (!days[date]?.includes(slot)) {
      ctx.status = 409;
      ctx.body = { error: 'slot_unavailable' };
      return;
    }

    const token = crypto.randomBytes(16).toString('hex');
    const created: any = await strapi.db.query(REQ).create({
      data: {
        requestStatus: 'requested', name, email, phone, concern, date, slot, language, token,
        ...(paid ? { paymentStatus: 'pending_payment', paymentMethod: method, currency, amountMinor } : {}),
      },
    });
    const reference = `CR-${String(created.id).padStart(5, '0')}`;
    await strapi.db.query(REQ).update({ where: { id: created.id }, data: { reference } });
    ctx.body = { reference, token, payment: paid ? 'pending_payment' : null, amountMinor: paid ? amountMinor : null, currency: paid ? currency : null };
  },

  async status(ctx: any) {
    const r = await byRef(ctx);
    if (!r) return ctx.notFound();
    ctx.body = { request: view(r) };
  },

  /** Razorpay: remember which Razorpay order belongs to this request. */
  async attachPayment(ctx: any) {
    const r = await byRef(ctx);
    const rzp = str(ctx.request.body?.razorpayOrderId, 80);
    if (!r || !rzp) return ctx.badRequest('Invalid payment');
    await strapi.db.query(REQ).update({ where: { id: r.id }, data: { razorpayOrderId: rzp } });
    ctx.body = { ok: true };
  },

  /** Idempotent: safe to call from both the browser and the payment webhook. */
  async markPaid(ctx: any) {
    const rzpOrder = str(ctx.request.body?.razorpayOrderId, 80);
    const rzpPayment = str(ctx.request.body?.razorpayPaymentId, 80);
    if (!rzpOrder) return ctx.badRequest('Missing payment order');
    const r: any = await strapi.db.query(REQ).findOne({ where: { razorpayOrderId: rzpOrder } });
    if (!r) return ctx.notFound();

    const amount = ctx.request.body?.amountMinor;
    const cur = ctx.request.body?.currency;
    if (Number.isInteger(amount) && (r.amountMinor !== amount || (typeof cur === 'string' && cur.toUpperCase() !== r.currency))) {
      await strapi.db.query(REQ).update({
        where: { id: r.id },
        data: { adminNotes: `Payment amount mismatch: Razorpay reported ${amount} ${cur ?? ''}, expected ${r.amountMinor} ${r.currency}.` },
      });
      ctx.status = 409;
      ctx.body = { error: 'Amount mismatch' };
      return;
    }
    if (PAID.includes(r.paymentStatus)) {
      ctx.body = { request: view(r), justPaid: false };
      return;
    }
    const updated = await strapi.db.query(REQ).update({
      where: { id: r.id },
      data: { paymentStatus: 'paid', razorpayPaymentId: rzpPayment || r.razorpayPaymentId, paidAt: new Date() },
    });
    ctx.body = { request: view(updated), justPaid: true };
  },

  async markFailed(ctx: any) {
    const rzpOrder = str(ctx.request.body?.razorpayOrderId, 80);
    if (!rzpOrder) return ctx.badRequest('Missing payment order');
    const r: any = await strapi.db.query(REQ).findOne({ where: { razorpayOrderId: rzpOrder } });
    if (r && r.paymentStatus === 'pending_payment') {
      await strapi.db.query(REQ).update({ where: { id: r.id }, data: { paymentStatus: 'payment_failed' } });
    }
    ctx.body = { ok: true };
  },

  /** UPI: the customer says they paid and gives the reference. You then check it and set the payment to paid. */
  async submitUtr(ctx: any) {
    const r = await byRef(ctx);
    const utr = str(ctx.request.body?.utr, 40);
    if (!/^[A-Za-z0-9]{8,40}$/.test(utr)) return ctx.badRequest('Invalid reference');
    if (!r || r.paymentMethod !== 'upi_manual') return ctx.notFound();
    if (!['pending_payment', 'payment_submitted'].includes(r.paymentStatus)) {
      ctx.body = { request: view(r), changed: false };
      return;
    }
    const dup: any = await strapi.db.query(REQ).findOne({ where: { utr, id: { $ne: r.id } } });
    const symbol = r.currency === 'EUR' ? '€' : '₹';
    const notes = [
      `Expected payment: ${symbol}${(r.amountMinor / 100).toFixed(2)}. Reference: ${utr}.`,
      dup ? `WARNING: the same reference was also given for ${dup.reference}.` : '',
    ].filter(Boolean).join(' ');
    const updated = await strapi.db.query(REQ).update({
      where: { id: r.id },
      data: { utr, paymentStatus: 'payment_submitted', paymentSubmittedAt: new Date(), adminNotes: notes },
    });
    ctx.body = { request: view(updated), changed: true };
  },
};
