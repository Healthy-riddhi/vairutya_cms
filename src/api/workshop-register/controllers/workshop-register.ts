import crypto from 'node:crypto';

const REG = 'api::workshop-registration.workshop-registration';
const WORKSHOP = 'api::workshop.workshop';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const toMinor = (v: unknown) => (Number(v) > 0 ? Math.round(Number(v) * 100) : 0);

/** Constant-time check of the secret token in the customer's link. */
function tokenOk(r: any, t: string) {
  return r && typeof r.token === 'string' && r.token.length === t.length && crypto.timingSafeEqual(Buffer.from(r.token), Buffer.from(t));
}

/** What the website may know about a registration. The secret token is required to ask for it. */
function view(r: any) {
  return {
    reference: r.reference,
    token: r.token, // only ever sent to the website's server, never to the browser by this endpoint
    workshopTitle: r.workshopTitle,
    workshopSlug: r.workshopSlug,
    dateLabel: r.dateLabel,
    name: r.name,
    email: r.email,
    phone: r.phone,
    note: r.note ?? '',
    language: r.language === 'fr' ? 'fr' : 'en',
    registrationStatus: r.registrationStatus,
    // payment (null on free registrations)
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
  const r: any = await strapi.db.query(REG).findOne({ where: { reference } });
  return tokenOk(r, t) ? r : null;
}

export default {
  /**
   * Saves one registration. The workshop, the date and the price are all worked out here from what is published
   * in Strapi, so only real workshops and dates can be registered for and the price can't be changed from the browser.
   * With a price set, the registration starts as "pending_payment".
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
    const currency: 'INR' | 'EUR' = b.currency === 'EUR' ? 'EUR' : 'INR';
    const method = b.paymentMethod === 'razorpay' ? 'razorpay' : 'upi_manual';

    if (!slug || !dateValue || !name || !phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ctx.badRequest('invalid');

    // English is the base entry. Its published version holds the dates and the price.
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
    const amountMinor = toMinor(currency === 'EUR' ? workshop.priceEur : workshop.priceInr);
    const paid = amountMinor > 0;

    const answer = (r: any, duplicate: boolean) => ({
      reference: r.reference, token: r.token, workshopTitle: r.workshopTitle, dateLabel: r.dateLabel, duplicate,
      payment: r.paymentStatus ?? null, amountMinor: r.amountMinor ?? null, currency: r.currency ?? null,
    });

    // The same person registering again for the same date
    const dup: any = await strapi.db.query(REG).findOne({ where: { email, workshopSlug: slug, dateValue } });
    if (dup) {
      // Not paid yet (or the payment failed): let them continue, with today's price
      if (paid && ['pending_payment', 'payment_failed'].includes(dup.paymentStatus)) {
        const updated = await strapi.db.query(REG).update({
          where: { id: dup.id },
          data: { paymentStatus: 'pending_payment', currency, amountMinor, paymentMethod: method },
        });
        ctx.body = answer({ ...dup, ...updated }, false);
        return;
      }
      ctx.body = answer(dup, true);
      return;
    }

    const token = crypto.randomBytes(16).toString('hex');
    const created: any = await strapi.db.query(REG).create({
      data: {
        registrationStatus: 'new',
        workshopTitle: workshop.title,
        workshopSlug: slug,
        dateLabel: date.label,
        dateValue,
        name, email, phone, note, language, token,
        ...(paid ? { paymentStatus: 'pending_payment', paymentMethod: method, currency, amountMinor } : {}),
      },
    });
    const reference = `WR-${String(created.id).padStart(5, '0')}`;
    const saved = await strapi.db.query(REG).update({ where: { id: created.id }, data: { reference } });
    ctx.body = answer({ ...created, ...saved, reference }, false);
  },

  async status(ctx: any) {
    const r = await byRef(ctx);
    if (!r) return ctx.notFound();
    ctx.body = { registration: view(r) };
  },

  /** Razorpay: remember which Razorpay order belongs to this registration. */
  async attachPayment(ctx: any) {
    const r = await byRef(ctx);
    const rzp = str(ctx.request.body?.razorpayOrderId, 80);
    if (!r || !rzp) return ctx.badRequest('Invalid payment');
    await strapi.db.query(REG).update({ where: { id: r.id }, data: { razorpayOrderId: rzp } });
    ctx.body = { ok: true };
  },

  /** Idempotent: safe to call from both the browser and the payment webhook. */
  async markPaid(ctx: any) {
    const rzpOrder = str(ctx.request.body?.razorpayOrderId, 80);
    const rzpPayment = str(ctx.request.body?.razorpayPaymentId, 80);
    if (!rzpOrder) return ctx.badRequest('Missing payment order');
    const r: any = await strapi.db.query(REG).findOne({ where: { razorpayOrderId: rzpOrder } });
    if (!r) return ctx.notFound();

    const amount = ctx.request.body?.amountMinor;
    const cur = ctx.request.body?.currency;
    if (Number.isInteger(amount) && (r.amountMinor !== amount || (typeof cur === 'string' && cur.toUpperCase() !== r.currency))) {
      await strapi.db.query(REG).update({
        where: { id: r.id },
        data: { adminNotes: `Payment amount mismatch: Razorpay reported ${amount} ${cur ?? ''}, expected ${r.amountMinor} ${r.currency}.` },
      });
      ctx.status = 409;
      ctx.body = { error: 'Amount mismatch' };
      return;
    }
    if (r.paymentStatus === 'paid') {
      ctx.body = { registration: view(r), justPaid: false };
      return;
    }
    const updated = await strapi.db.query(REG).update({
      where: { id: r.id },
      data: { paymentStatus: 'paid', razorpayPaymentId: rzpPayment || r.razorpayPaymentId, paidAt: new Date() },
    });
    ctx.body = { registration: view({ ...r, ...updated }), justPaid: true };
  },

  async markFailed(ctx: any) {
    const rzpOrder = str(ctx.request.body?.razorpayOrderId, 80);
    if (!rzpOrder) return ctx.badRequest('Missing payment order');
    const r: any = await strapi.db.query(REG).findOne({ where: { razorpayOrderId: rzpOrder } });
    if (r && r.paymentStatus === 'pending_payment') {
      await strapi.db.query(REG).update({ where: { id: r.id }, data: { paymentStatus: 'payment_failed' } });
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
      ctx.body = { registration: view(r), changed: false };
      return;
    }
    const dup: any = await strapi.db.query(REG).findOne({ where: { utr, id: { $ne: r.id } } });
    const symbol = r.currency === 'EUR' ? '€' : '₹';
    const notes = [
      `Expected payment: ${symbol}${(r.amountMinor / 100).toFixed(2)}. Reference: ${utr}.`,
      dup ? `WARNING: the same reference was also given for ${dup.reference}.` : '',
    ].filter(Boolean).join(' ');
    const updated = await strapi.db.query(REG).update({
      where: { id: r.id },
      data: { utr, paymentStatus: 'payment_submitted', paymentSubmittedAt: new Date(), adminNotes: notes },
    });
    ctx.body = { registration: view({ ...r, ...updated }), changed: true };
  },
};
