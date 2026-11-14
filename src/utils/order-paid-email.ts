import { shell, para, esc } from './email-html';

const frontend = () => (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** "Your payment is confirmed", in the language the customer ordered in. */
export function paidEmail(o: any) {
  const fr = o.language === 'fr';
  const money = (m: number) =>
    new Intl.NumberFormat(fr ? 'fr-FR' : 'en-IN', {
      style: 'currency',
      currency: o.currency || 'INR',
      minimumFractionDigits: Number.isInteger(m / 100) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(m / 100);

  const first = String(o.customerName ?? '').trim().split(/\s+/)[0] || (fr ? '' : 'there');
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  const row = (a: string, b: string, bold = false) =>
    `<tr><td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;${bold ? 'font-weight:bold;' : ''}">${a}</td><td align="right" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;${bold ? 'font-weight:bold;' : ''}">${b}</td></tr>`;

  const t = fr
    ? { subject: `Votre commande Vairutya ${o.orderNumber} est confirmée`, heading: 'Merci pour votre commande',
        hi: first ? `Bonjour ${first},` : 'Bonjour,', line: `Nous avons bien reçu votre paiement de <strong>${esc(money(o.totalMinor))}</strong> pour la commande <strong>${esc(o.orderNumber)}</strong>. Nous vous écrirons à nouveau dès son expédition.`,
        ship: 'Livraison à', free: 'Gratuite', shipping: 'Livraison', total: 'Total', view: 'Voir votre commande', bye: 'Avec bienveillance,<br>Vairutya', byeText: 'Avec bienveillance,\nVairutya' }
    : { subject: `Your Vairutya order ${o.orderNumber} is confirmed`, heading: 'Thank you for your order',
        hi: `Hi ${first},`, line: `We've received your payment of <strong>${esc(money(o.totalMinor))}</strong> for order <strong>${esc(o.orderNumber)}</strong>. We'll email you again when it ships.`,
        ship: 'Shipping to', free: 'Free', shipping: 'Shipping', total: 'Total', view: 'View your order', bye: 'With care,<br>Vairutya', byeText: 'With care,\nVairutya' };

  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid #e7e1dc;border-bottom:1px solid #e7e1dc;">
${items.map((i) => row(`${esc(String(i.name))} × ${Number(i.qty)}`, esc(money(i.lineMinor)))).join('')}
${row(t.shipping, o.shippingMinor === 0 ? t.free : esc(money(o.shippingMinor)))}
${row(t.total, esc(money(o.totalMinor)), true)}
</table>`;

  const a = o.shippingAddress ?? {};
  const addr = [a.name, a.line1, a.line2, [a.postcode, a.city].filter(Boolean).join(' '), a.state].filter(Boolean).map((x: string) => esc(String(x))).join('<br>');
  const url = `${frontend()}${fr ? '/fr' : ''}/account/orders/${o.orderNumber}`;
  const button = `<p style="margin:24px 0;"><a href="${esc(url)}" style="display:inline-block;background:#003b43;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;padding:14px 30px;border-radius:999px;">${esc(t.view)}</a></p>`;

  const html = shell(
    t.heading,
    para(esc(t.hi)) + para(t.line) + table +
      `<p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b63;">${esc(t.ship)}</p>` +
      para(addr) + button + para(t.bye)
  );
  const text = `${t.hi}\n\n${o.orderNumber}: ${money(o.totalMinor)}\n${items.map((i) => `- ${i.name} x ${i.qty}`).join('\n')}\n\n${t.view}: ${url}\n\n${t.byeText}`;
  return { subject: t.subject, html, text };
}
