import { shell, para, esc } from './email-html';

const REG = 'api::workshop-registration.workshop-registration';
const frontend = () => (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const button = (href: string, label: string) =>
  `<p style="margin:28px 0;"><a href="${esc(href)}" style="display:inline-block;background:#003b43;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.04em;padding:14px 30px;border-radius:999px;">${esc(label)}</a></p>`;

/** "Payment received" for a workshop registration. */
export function paymentReceivedEmail(r: any) {
  const fr = r.language === 'fr';
  const first = String(r.name ?? '').trim().split(/\s+/)[0] ?? '';
  const money = new Intl.NumberFormat(fr ? 'fr-FR' : 'en-IN', {
    style: 'currency', currency: r.currency || 'INR',
    minimumFractionDigits: Number.isInteger((r.amountMinor ?? 0) / 100) ? 0 : 2, maximumFractionDigits: 2,
  }).format((r.amountMinor ?? 0) / 100);
  const seats = Number(r.seats) > 0 ? Number(r.seats) : 1;
  const passText = r.passLabel ? (fr ? `${r.passLabel} (${seats} ${seats > 1 ? 'places' : 'place'})` : `${r.passLabel} (${seats} ${seats > 1 ? 'seats' : 'seat'})`) : '';
  const url = `${frontend()}${fr ? '/fr' : ''}/workshop-registration/confirmed?ref=${encodeURIComponent(r.reference)}&t=${encodeURIComponent(r.token)}`;

  const t = fr
    ? { subject: `Paiement reçu pour votre atelier (${r.reference})`, heading: 'Merci, nous avons bien reçu votre paiement',
        hi: first ? `Bonjour ${first},` : 'Bonjour,',
        line: `Nous avons bien reçu votre paiement de ${money} pour l’atelier « ${r.workshopTitle} » du :`,
        next: 'Votre place est enregistrée. Nous vous écrirons si nous avons besoin de quoi que ce soit avant la séance.',
        view: 'Voir mon inscription', bye: 'Avec bienveillance,<br>Vairutya', byeText: 'Avec bienveillance,\nVairutya' }
    : { subject: `Payment received for your workshop (${r.reference})`, heading: 'Thank you, we’ve received your payment',
        hi: `Hi ${first || 'there'},`,
        line: `We’ve received your payment of ${money} for “${r.workshopTitle}” on:`,
        next: 'Your seat is registered. We’ll email you if we need anything before the session.',
        view: 'View my registration', bye: 'With care,<br>Vairutya', byeText: 'With care,\nVairutya' };

  const html = shell(
    t.heading,
    para(esc(t.hi)) + para(esc(t.line)) + para(`<strong style="color:#003b43;">${esc(r.dateLabel)}</strong>`) + (passText ? para(esc(passText)) : '') + para(esc(t.next)) +
      button(url, t.view) + para(t.bye)
  );
  const text = [t.hi, '', t.line, r.dateLabel, ...(passText ? [passText] : []), '', t.next, '', `${t.view}: ${url}`, '', t.byeText].join('\n');
  return { subject: t.subject, html, text };
}

/** Sends it once. For UPI this runs when you set paymentStatus to paid; for Razorpay, the website does it. */
export async function sendWorkshopPaid(strapi: any, r: any) {
  try {
    await strapi.plugin('email').service('email').send({ to: r.email, ...paymentReceivedEmail(r) });
    await strapi.db.query(REG).update({ where: { id: r.id }, data: { paidEmailSentAt: new Date(), paidAt: r.paidAt ?? new Date() } });
  } catch (err) {
    strapi.log.error(`[workshop] payment email for ${r.reference} failed: ${(err as Error).message}. Save the registration again to retry.`);
  }
}
