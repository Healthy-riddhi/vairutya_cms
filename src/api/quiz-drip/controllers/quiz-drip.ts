import crypto from 'node:crypto';
import { SEQUENCES, STEPS, isDue } from '../../../utils/quiz-drip';

const SUB = 'api::quiz-subscriber.quiz-subscriber';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default {
  /** The quiz was finished and they ticked the box: start (or restart) their emails. */
  async subscribe(ctx: any) {
    const b = ctx.request.body ?? {};
    const email = str(b.email, 254).toLowerCase();
    const quizSlug = str(b.quizSlug, 80);
    const sequence = str(b.sequence, 40);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !quizSlug || !SEQUENCES.includes(sequence)) return ctx.badRequest('Invalid request');

    const data = {
      firstName: str(b.firstName, 80),
      sequence,
      language: b.language === 'fr' ? 'fr' : 'en',
      status: 'active',
      nextStep: 1,
      startedAt: new Date(),
      lastSentAt: null,
    };
    const existing: any = await strapi.db.query(SUB).findOne({ where: { email, quizSlug } });
    if (existing) {
      // Retaking the quiz: they get the emails for their new result, from the start.
      await strapi.db.query(SUB).update({ where: { id: existing.id }, data });
      ctx.body = { ok: true, restarted: true };
      return;
    }
    await strapi.db.query(SUB).create({ data: { ...data, email, quizSlug, token: crypto.randomBytes(18).toString('hex') } });
    ctx.body = { ok: true, restarted: false };
  },

  /** Everyone whose next email is ready. The website's daily job asks for this. */
  async due(ctx: any) {
    const limit = Math.min(Math.max(Number(ctx.query.limit) || 100, 1), 300);
    const rows: any[] = await strapi.db.query(SUB).findMany({ where: { status: 'active' }, orderBy: { startedAt: 'asc' } });
    const items = rows
      .filter((s) => isDue(s))
      .slice(0, limit)
      .map((s) => ({
        id: s.id, email: s.email, firstName: s.firstName ?? '', sequence: s.sequence, step: s.nextStep,
        language: s.language, token: s.token, startedAt: s.startedAt,
      }));
    ctx.body = { items };
  },

  /**
   * Reserve an email before sending it, so two overlapping runs can't both send it.
   * Succeeds only if the subscriber is still waiting for exactly this email.
   */
  async claim(ctx: any) {
    const id = Number(ctx.request.body?.id);
    const step = Number(ctx.request.body?.step);
    if (!Number.isInteger(id) || !Number.isInteger(step)) return ctx.badRequest('Invalid request');
    const s: any = await strapi.db.query(SUB).findOne({ where: { id } });
    if (!s || s.status !== 'active' || s.nextStep !== step) { ctx.body = { ok: false }; return; }
    const previousLastSentAt = s.lastSentAt ?? null;
    const claimed = await strapi.db.query(SUB).updateMany({
      where: { id, status: 'active', nextStep: step },
      data: { nextStep: step + 1, status: step >= STEPS ? 'completed' : 'active', lastSentAt: new Date() },
    });
    ctx.body = { ok: (claimed?.count ?? 0) > 0, previousLastSentAt };
  },

  /** The send failed after it was reserved: put them back so tomorrow's run tries again. */
  async release(ctx: any) {
    const id = Number(ctx.request.body?.id);
    const step = Number(ctx.request.body?.step);
    if (!Number.isInteger(id) || !Number.isInteger(step)) return ctx.badRequest('Invalid request');
    await strapi.db.query(SUB).updateMany({
      where: { id, nextStep: step + 1 },
      data: { nextStep: step, status: 'active', lastSentAt: ctx.request.body?.previousLastSentAt ?? null },
    });
    ctx.body = { ok: true };
  },

  /** Stop someone's emails (they asked, or never confirmed their address). */
  async stop(ctx: any) {
    const id = Number(ctx.request.body?.id);
    const status = ctx.request.body?.status === 'expired' ? 'expired' : 'unsubscribed';
    if (!Number.isInteger(id)) return ctx.badRequest('Invalid request');
    await strapi.db.query(SUB).updateMany({ where: { id, status: 'active' }, data: { status } });
    ctx.body = { ok: true };
  },

  /** The unsubscribe link in each email. Idempotent. */
  async unsubscribe(ctx: any) {
    const token = str(ctx.request.body?.token ?? ctx.query.t, 64);
    if (token.length < 16) return ctx.badRequest('Invalid link');
    const s: any = await strapi.db.query(SUB).findOne({ where: { token } });
    if (!s) return ctx.notFound();
    if (s.status !== 'unsubscribed') await strapi.db.query(SUB).update({ where: { id: s.id }, data: { status: 'unsubscribed' } });
    ctx.body = { ok: true };
  },
};
