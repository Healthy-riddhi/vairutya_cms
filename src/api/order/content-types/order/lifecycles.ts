import { shell, para, esc } from '../../../../utils/email-html';
import { paidEmail } from '../../../../utils/order-paid-email';

const UID = 'api::order.order';
const PAID = ['paid', 'processing', 'shipped', 'delivered'];

/** UPI orders: when you set the status to paid, the customer is emailed once. */
async function sendPaid(order: any) {
  if (order.paymentMethod !== 'upi_manual' || !PAID.includes(order.orderStatus) || order.paidEmailSentAt || !order.email) return;
  try {
    await strapi.plugin('email').service('email').send({ to: order.email, ...paidEmail(order) });
    await strapi.db.query(UID).update({
      where: { id: order.id },
      data: { paidEmailSentAt: new Date(), paidAt: order.paidAt ?? new Date() },
    });
  } catch (err) {
    strapi.log.error(`[shop] payment confirmation email for ${order.orderNumber} failed: ${(err as Error).message}. Save the order again to retry.`);
  }
}

/** When you set an order to "shipped", the customer is emailed once, with the carrier and tracking number if you filled them in. */
async function sendShipped(order: any) {
  if (order.orderStatus !== 'shipped' || order.shippedEmailSentAt || !order.email) return;
  const tracking = order.trackingNumber
    ? para(`Carrier: <strong>${esc(order.carrier || 'see tracking')}</strong><br>Tracking number: <strong>${esc(order.trackingNumber)}</strong>`)
    : '';
  try {
    await strapi.plugin('email').service('email').send({
      to: order.email,
      subject: `Your Vairutya order ${order.orderNumber} has shipped`,
      html: shell(
        'Your order is on its way',
        para(`Hi ${esc((order.customerName || 'there').split(' ')[0])},`) +
          para(`Good news: your order <strong>${esc(order.orderNumber)}</strong> has shipped.`) +
          tracking +
          para('Thank you for choosing Vairutya.<br>With care, Vairutya')
      ),
    });
    await strapi.db.query(UID).update({
      where: { id: order.id },
      data: { shippedEmailSentAt: new Date(), shippedAt: order.shippedAt ?? new Date() },
    });
  } catch (err) {
    strapi.log.error(`[shop] shipping email failed for ${order.orderNumber}: ${(err as Error).message}`);
  }
}

export default {
  async afterUpdate(event: any) {
    const order = event.result;
    if (!order) return;
    await sendPaid(order);
    await sendShipped(order);
  },
};
