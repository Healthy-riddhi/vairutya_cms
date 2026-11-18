import { shell, para, esc } from './email-html';

const OFFSET = '+05:30'; // India has no daylight saving, so a fixed offset is exact
const REQ = 'api::consultation-request.consultation-request';
const AVAIL = 'api::consultation-availability.consultation-availability';
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** "9:00, 14:30" → ["09:00", "14:30"]. Anything invalid is ignored. */
export function parseTimes(raw: unknown): string[] {
  const out = new Set<string>();
  for (const part of String(raw ?? '').split(/[,;\s]+/)) {
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(part.trim());
    if (m) out.add(`${m[1].padStart(2, '0')}:${m[2]}`);
  }
  return [...out].sort();
}

const addDays = (iso: string, n: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

const PKG = 'api::consultation-package.consultation-package';
const toMinor = (v: unknown) => (Number(v) > 0 ? Math.round(Number(v) * 100) : 0);
const toLines = (v: unknown) => (typeof v === 'string' ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : []);

/**
 * A single fee per currency in paise/cents (0 = no payment). Only used when there are no packages:
 * set in Strapi under Consultation Availability.
 */
export async function getFees(strapi: any): Promise<{ INR: number; EUR: number }> {
  const cfg = await strapi.documents(AVAIL).findFirst({});
  return { INR: toMinor(cfg?.feeInr), EUR: toMinor(cfg?.feeEur) };
}

export type Currency = 'INR' | 'EUR';

/** The active packages for the website, in order. Prices are in paise/cents (0 = not offered in that currency). */
export async function getPackages(strapi: any) {
  const rows: any[] = await strapi.db.query(PKG).findMany({});
  return rows
    .filter((r) => r.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
    .map((r) => ({
      slug: r.slug as string,
      kind: r.kind as 'base' | 'addon' | 'program',
      months: r.months ?? null,
      title: r.title as string,
      titleFr: r.titleFr || null,
      idealFor: r.idealFor || null,
      idealForFr: r.idealForFr || null,
      includes: toLines(r.includes),
      includesFr: toLines(r.includesFr),
      priceMinor: { INR: toMinor(r.priceInr), EUR: toMinor(r.priceEur) },
    }));
}

/**
 * What someone is buying and what it costs, worked out here so the price can't be changed from the browser.
 * An add-on only goes with the base package, and only one add-on at a time.
 */
export function priceSelection(
  pkgs: Awaited<ReturnType<typeof getPackages>>,
  currency: Currency,
  packageSlug: string,
  addOnSlug: string
): { error: string } | { amountMinor: number; base: (typeof pkgs)[number]; add: (typeof pkgs)[number] | null } {
  const base = pkgs.find((p) => p.slug === packageSlug && p.kind !== 'addon');
  if (!base || !(base.priceMinor[currency] > 0)) return { error: 'package_invalid' };
  let add: (typeof pkgs)[number] | null = null;
  if (addOnSlug) {
    add = pkgs.find((p) => p.slug === addOnSlug && p.kind === 'addon') ?? null;
    if (!add || base.kind !== 'base' || !(add.priceMinor[currency] > 0)) return { error: 'addon_invalid' };
  }
  return { amountMinor: base.priceMinor[currency] + (add?.priceMinor[currency] ?? 0), base, add };
}

/** An unpaid booking holds its slot for this long, so the page the customer pays on stays valid. */
const HOLD_MINUTES = 20;

/** { "2026-12-04": ["10:00", "11:00"], … } for every bookable day. */
export async function computeDays(strapi: any): Promise<Record<string, string[]>> {
  const cfg = await strapi.documents(AVAIL).findFirst({ populate: { weeklyHours: true, overrides: true } });
  if (!cfg || cfg.acceptingRequests === false) return {};

  const maxDays = Math.min(365, Math.max(1, Number(cfg.maxDaysAhead) || 60));
  const notice = Math.min(720, Math.max(0, Number(cfg.minNoticeHours ?? 24))) * 3_600_000;

  const weekly = new Map<string, Set<string>>();
  for (const row of cfg.weeklyHours ?? []) {
    const set = weekly.get(row.weekday) ?? new Set<string>();
    parseTimes(row.times).forEach((t) => set.add(t));
    weekly.set(row.weekday, set);
  }
  const overrides = new Map<string, any>();
  for (const o of cfg.overrides ?? []) if (o.date) overrides.set(String(o.date).slice(0, 10), o);

  const today = istToday();
  const last = addDays(today, maxDays);
  const holdSince = new Date(Date.now() - HOLD_MINUTES * 60_000);
  const booked: any[] = await strapi.db.query(REQ).findMany({
    where: {
      date: { $gte: today, $lte: last },
      $or: [
        { requestStatus: 'confirmed' },
        // paid or "I've paid" bookings keep their slot until you confirm or cancel them
        { requestStatus: 'requested', paymentStatus: { $in: ['payment_submitted', 'paid'] } },
        // unpaid bookings hold the slot for a short while
        { requestStatus: 'requested', paymentStatus: 'pending_payment', createdAt: { $gte: holdSince } },
      ],
    },
    select: ['date', 'slot'],
  });
  const taken = new Set(booked.map((r) => `${String(r.date).slice(0, 10)}|${r.slot}`));

  const now = Date.now();
  const days: Record<string, string[]> = {};
  for (let i = 0; i <= maxDays; i++) {
    const date = addDays(today, i);
    let times = [...(weekly.get(WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]) ?? [])].sort();
    const o = overrides.get(date);
    if (o) {
      if (o.closed !== false) times = [];
      else {
        const special = parseTimes(o.times);
        if (special.length) times = special;
      }
    }
    const open = times.filter(
      (t) => !taken.has(`${date}|${t}`) && Date.parse(`${date}T${t}:00${OFFSET}`) - now >= notice
    );
    if (open.length) days[date] = open;
  }
  return days;
}

/* ------------------------------ confirmation email ------------------------------ */

type Lang = 'en' | 'fr';
const frontend = () => (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const timeLabel = (slot: string, lang: Lang) => {
  const [h, m] = slot.split(':').map(Number);
  const mm = String(m).padStart(2, '0');
  return lang === 'fr' ? `${h}h${mm}` : `${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
};
const longDate = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
const parisTime = (iso: string, slot: string) => {
  const d = new Date(`${iso}T${slot}:00${OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Paris' }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value;
  const m = parts.find((p) => p.type === 'minute')?.value;
  return h && m ? `${Number(h)}h${m}` : null;
};

const button = (href: string, label: string) =>
  `<p style="margin:28px 0;"><a href="${esc(href)}" style="display:inline-block;background:#003b43;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.04em;padding:14px 30px;border-radius:999px;">${esc(label)}</a></p>`;

export function confirmationEmail(r: any) {
  const lang: Lang = r.language === 'fr' ? 'fr' : 'en';
  const fr = lang === 'fr';
  const date = String(r.date).slice(0, 10);
  const slot = String(r.slot);
  const first = String(r.name ?? '').trim().split(/\s+/)[0] ?? '';
  const paris = fr ? parisTime(date, slot) : null;

  const when = fr
    ? `${longDate(date, 'fr')} à ${timeLabel(slot, 'fr')} (heure de l’Inde, IST)${paris ? `, soit ${paris} à Paris` : ''}`
    : `${longDate(date, 'en')} at ${timeLabel(slot, 'en')} IST (India Standard Time)`;
  const url = `${frontend()}${fr ? '/fr' : ''}/consultation/confirmed?ref=${encodeURIComponent(r.reference)}&t=${encodeURIComponent(r.token)}`;
  const link = typeof r.meetingLink === 'string' && /^https?:\/\//i.test(r.meetingLink.trim()) ? r.meetingLink.trim() : '';
  const note = String(r.messageToCustomer ?? '').trim();

  const t = fr
    ? {
        subject: 'Votre consultation Vairutya est confirmée',
        heading: 'Votre consultation est confirmée',
        hi: first ? `Bonjour ${first},` : 'Bonjour,',
        line: 'Votre consultation est confirmée :',
        join: 'Rejoindre l’appel',
        view: 'Voir votre confirmation',
        change: 'Besoin de changer de créneau ? Répondez simplement à cet e-mail.',
        bye: 'Avec bienveillance,<br>Vairutya',
        byeText: 'Avec bienveillance,\nVairutya',
      }
    : {
        subject: 'Your Vairutya consultation is confirmed',
        heading: 'Your consultation is confirmed',
        hi: `Hi ${first || 'there'},`,
        line: 'Your consultation is confirmed for:',
        join: 'Join your call',
        view: 'View your confirmation',
        change: 'Need to change your slot? Just reply to this email.',
        bye: 'With care,<br>Vairutya',
        byeText: 'With care,\nVairutya',
      };

  const html = shell(
    t.heading,
    para(esc(t.hi)) +
      para(esc(t.line)) +
      para(`<strong style="color:#003b43;">${esc(when)}</strong>`) +
      (note ? para(esc(note).replace(/\n/g, '<br>')) : '') +
      (link ? button(link, t.join) : '') +
      para(`<a href="${esc(url)}" style="color:#003b43;">${esc(t.view)}</a>`) +
      para(esc(t.change)) +
      para(t.bye)
  );
  const text = [t.hi, '', t.line, when, note, link ? `${t.join}: ${link}` : '', `${t.view}: ${url}`, '', t.change, '', t.byeText]
    .filter((x, i, a) => x !== '' || a[i - 1] !== '')
    .join('\n');

  return { subject: t.subject, html, text };
}

/** Sends the confirmation, then marks it sent so it never goes out twice. */
export async function sendConsultationConfirmed(strapi: any, r: any) {
  try {
    const mail = confirmationEmail(r);
    await strapi.plugin('email').service('email').send({ to: r.email, ...mail });
    await strapi.db.query(REQ).update({
      where: { id: r.id },
      data: { confirmationEmailSentAt: new Date(), confirmedAt: r.confirmedAt ?? new Date() },
    });
  } catch (err) {
    strapi.log.error(`[consultation] confirmation email for ${r.reference} failed: ${(err as Error).message}. Save the request again to retry.`);
  }
}


/* ------------------------------ payment received email ------------------------------ */

/** "Payment received, we'll confirm your slot" – sent once, when the payment becomes paid. */
export function paymentReceivedEmail(r: any) {
  const fr = r.language === 'fr';
  const date = String(r.date).slice(0, 10);
  const slot = String(r.slot);
  const first = String(r.name ?? '').trim().split(/\s+/)[0] ?? '';
  const paris = fr ? parisTime(date, slot) : null;
  const when = fr
    ? `${longDate(date, 'fr')} à ${timeLabel(slot, 'fr')} (heure de l’Inde, IST)${paris ? `, soit ${paris} à Paris` : ''}`
    : `${longDate(date, 'en')} at ${timeLabel(slot, 'en')} IST (India Standard Time)`;
  const money = new Intl.NumberFormat(fr ? 'fr-FR' : 'en-IN', {
    style: 'currency', currency: r.currency || 'INR',
    minimumFractionDigits: Number.isInteger((r.amountMinor ?? 0) / 100) ? 0 : 2, maximumFractionDigits: 2,
  }).format((r.amountMinor ?? 0) / 100);
  const pkg = [r.packageTitle, r.addOnTitle].filter(Boolean).join(' + ');
  const url = `${frontend()}${fr ? '/fr' : ''}/consultation/confirmed?ref=${encodeURIComponent(r.reference)}&t=${encodeURIComponent(r.token)}`;

  const t = fr
    ? { subject: `Paiement reçu pour votre consultation (${r.reference})`, heading: 'Merci, nous avons bien reçu votre paiement',
        hi: first ? `Bonjour ${first},` : 'Bonjour,',
        line: `Nous avons bien reçu votre paiement de ${money}${pkg ? ` (${pkg})` : ''} pour la consultation du :`,
        next: 'Nous confirmons votre créneau par e-mail très prochainement, avec le lien de l’appel.',
        view: 'Suivre ma consultation', bye: 'Avec bienveillance,<br>Vairutya', byeText: 'Avec bienveillance,\nVairutya' }
    : { subject: `Payment received for your consultation (${r.reference})`, heading: 'Thank you, we’ve received your payment',
        hi: `Hi ${first || 'there'},`,
        line: `We’ve received your payment of ${money}${pkg ? ` (${pkg})` : ''} for your consultation on:`,
        next: 'We’ll confirm your slot by email very shortly, with the link to your call.',
        view: 'Check your consultation', bye: 'With care,<br>Vairutya', byeText: 'With care,\nVairutya' };

  const html = shell(
    t.heading,
    para(esc(t.hi)) + para(esc(t.line)) + para(`<strong style="color:#003b43;">${esc(when)}</strong>`) + para(esc(t.next)) +
      button(url, t.view) + para(t.bye)
  );
  const text = [t.hi, '', t.line, when, '', t.next, '', `${t.view}: ${url}`, '', t.byeText].join('\n');
  return { subject: t.subject, html, text };
}

/** Sends it once. For UPI this runs when you set paymentStatus to paid; for Razorpay, the website does it. */
export async function sendConsultationPaid(strapi: any, r: any) {
  try {
    await strapi.plugin('email').service('email').send({ to: r.email, ...paymentReceivedEmail(r) });
    await strapi.db.query(REQ).update({
      where: { id: r.id },
      data: { paidEmailSentAt: new Date(), paidAt: r.paidAt ?? new Date() },
    });
  } catch (err) {
    strapi.log.error(`[consultation] payment email for ${r.reference} failed: ${(err as Error).message}. Save the request again to retry.`);
  }
}
