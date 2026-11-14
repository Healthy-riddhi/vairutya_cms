const ORDER = 'api::order.order';

const posInt = (v: unknown) => (Number.isInteger(v) && (v as number) > 0 ? (v as number) : null);
const minor = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : null);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** What the website is allowed to see of an order. */
function view(o: any) {
  return {
    orderNumber: o.orderNumber,
    status: o.orderStatus,
    country: o.country,
    currency: o.currency,
    items: o.items,
    subtotalMinor: o.subtotalMinor,
    shippingMinor: o.shippingMinor,
    taxIncludedMinor: o.taxIncludedMinor,
    totalMinor: o.totalMinor,
    shippingAddress: o.shippingAddress,
    email: o.email,
    customerName: o.customerName,
    razorpayOrderId: o.razorpayOrderId,
    paymentMethod: o.paymentMethod,
    utr: o.utr,
    language: o.language,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
  };
}

export default {
  /** Save a new order (status: waiting for payment). Totals were worked out by the website from live prices. */
  async create(ctx: any) {
    const b = ctx.request.body ?? {};
    const userId = posInt(b.userId);
    const items = Array.isArray(b.items) ? b.items : null;
    const subtotal = minor(b.subtotalMinor);
    const shipping = minor(b.shippingMinor);
    const total = minor(b.totalMinor);
    const tax = b.taxIncludedMinor === null ? null : minor(b.taxIncludedMinor);
    if (!userId || !items?.length || subtotal === null || shipping === null || total === null || tax === undefined) {
      return ctx.badRequest('Invalid order');
    }
    if (!['IN', 'FR'].includes(b.country) || !['INR', 'EUR'].includes(b.currency)) {
      return ctx.badRequest('Invalid country or currency');
    }

    // A customer only needs one open basket: older unpaid orders are closed.
    if (b.paymentMethod !== 'upi_manual') await strapi.db.query(ORDER).updateMany({
      where: { user: userId, orderStatus: 'pending_payment' },
      data: { orderStatus: 'cancelled' },
    });

    const created = await strapi.db.query(ORDER).create({
      data: {
        orderStatus: 'pending_payment',
        paymentMethod: b.paymentMethod === 'upi_manual' ? 'upi_manual' : 'razorpay',
        language: b.language === 'fr' ? 'fr' : 'en',
        user: userId,
        email: str(b.email, 254),
        customerName: str(b.customerName, 80),
        phone: str(b.phone, 40),
        country: b.country,
        currency: b.currency,
        subtotalMinor: subtotal,
        shippingMinor: shipping,
        taxIncludedMinor: tax,
        totalMinor: total,
        items,
        shippingAddress: b.shippingAddress ?? {},
      },
    });
    const orderNumber = `VR-${String(created.id).padStart(5, '0')}`;
    await strapi.db.query(ORDER).update({ where: { id: created.id }, data: { orderNumber } });
    ctx.body = { orderNumber };
  },

  async attachPayment(ctx: any) {
    const rzp = str(ctx.request.body?.razorpayOrderId, 80);
    if (!rzp) return ctx.badRequest('Missing payment order');
    const order = await strapi.db.query(ORDER).findOne({ where: { orderNumber: ctx.params.orderNumber } });
    if (!order) return ctx.notFound();
    await strapi.db.query(ORDER).update({ where: { id: order.id }, data: { razorpayOrderId: rzp } });
    ctx.body = { ok: true };
  },

  /** Idempotent: safe to call from both the checkout and the payment webhook. */
  async markPaid(ctx: any) {
    const rzpOrder = str(ctx.request.body?.razorpayOrderId, 80);
    const rzpPayment = str(ctx.request.body?.razorpayPaymentId, 80);
    if (!rzpOrder) return ctx.badRequest('Missing payment order');

    const order = await strapi.db.query(ORDER).findOne({ where: { razorpayOrderId: rzpOrder } });
    if (!order) return ctx.notFound();

    // If Razorpay reports an amount, it must match what we asked for.
    const amount = ctx.request.body?.amountMinor;
    const cur = ctx.request.body?.currency;
    if (
      Number.isInteger(amount) &&
      (order.totalMinor !== amount || (typeof cur === 'string' && cur.toUpperCase() !== order.currency))
    ) {
      await strapi.db.query(ORDER).update({
        where: { id: order.id },
        data: { adminNotes: `Payment amount mismatch: Razorpay reported ${amount} ${cur ?? ''}, expected ${order.totalMinor} ${order.currency}.` },
      });
      ctx.status = 409;
      ctx.body = { error: 'Amount mismatch' };
      return;
    }

    const alreadyDone = ['paid', 'processing', 'shipped', 'delivered', 'refunded'].includes(order.orderStatus);
    if (alreadyDone) {
      ctx.body = { order: view(order), justPaid: false };
      return;
    }
    // Money arrived, even if the order had been closed or marked failed in the meantime.
    const updated = await strapi.db.query(ORDER).update({
      where: { id: order.id },
      data: { orderStatus: 'paid', razorpayPaymentId: rzpPayment || order.razorpayPaymentId, paidAt: new Date() },
    });
    ctx.body = { order: view(updated), justPaid: true };
  },

  async markFailed(ctx: any) {
    const rzpOrder = str(ctx.request.body?.razorpayOrderId, 80);
    if (!rzpOrder) return ctx.badRequest('Missing payment order');
    const order = await strapi.db.query(ORDER).findOne({ where: { razorpayOrderId: rzpOrder } });
    if (order && order.orderStatus === 'pending_payment') {
      await strapi.db.query(ORDER).update({ where: { id: order.id }, data: { orderStatus: 'payment_failed' } });
    }
    ctx.body = { ok: true };
  },

  /** The customer says they paid by UPI and gives the reference. The owner then checks and confirms. */
  async submitUtr(ctx: any) {
    const userId = posInt(Number(ctx.request.body?.userId));
    const utr = str(ctx.request.body?.utr, 40);
    if (!userId || !/^[A-Za-z0-9]{8,40}$/.test(utr)) return ctx.badRequest('Invalid reference');
    const order = await strapi.db.query(ORDER).findOne({ where: { orderNumber: ctx.params.orderNumber, user: userId } });
    if (!order || order.paymentMethod !== 'upi_manual') return ctx.notFound();
    if (!['pending_payment', 'payment_submitted'].includes(order.orderStatus)) {
      ctx.body = { order: view(order), changed: false };
      return;
    }
    const dup = await strapi.db.query(ORDER).findOne({ where: { utr, id: { $ne: order.id } } });
    const symbol = order.currency === 'EUR' ? '€' : '₹';
    const notes = [
      `Expected payment: ${symbol}${(order.totalMinor / 100).toFixed(2)}. Reference: ${utr}.`,
      dup ? `WARNING: the same reference was also given for ${dup.orderNumber}.` : '',
    ].filter(Boolean).join(' ');
    const updated = await strapi.db.query(ORDER).update({
      where: { id: order.id },
      data: { utr, orderStatus: 'payment_submitted', paymentSubmittedAt: new Date(), adminNotes: notes },
    });
    ctx.body = { order: view(updated), changed: true };
  },

  async list(ctx: any) {
    const userId = posInt(Number(ctx.query.userId));
    if (!userId) return ctx.badRequest('Missing user');
    const rows = await strapi.db.query(ORDER).findMany({
      where: {
        user: userId,
        $or: [
          { orderStatus: { $notIn: ['pending_payment', 'cancelled'] } },
          { orderStatus: 'pending_payment', paymentMethod: 'upi_manual' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
    ctx.body = { orders: rows.map(view) };
  },

  async detail(ctx: any) {
    const userId = posInt(Number(ctx.query.userId));
    if (!userId) return ctx.badRequest('Missing user');
    const order = await strapi.db.query(ORDER).findOne({
      where: { orderNumber: ctx.params.orderNumber, user: userId },
    });
    if (!order) return ctx.notFound();
    ctx.body = { order: view(order) };
  },
};
