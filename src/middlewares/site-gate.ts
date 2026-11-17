import crypto from 'node:crypto';

/**
 * Only the Vairutya website may use the account endpoints (log in, register, reset
 * password, profile…). Everyone else on the internet gets a 403, so nobody can try
 * passwords against Strapi directly. The website proves who it is with a shared secret.
 *
 * The email-confirmation link is exempt: customers click it straight from their inbox.
 */
const PROTECTED = [/^\/api\/auth\//, /^\/api\/users/, /^\/api\/account/, /^\/api\/shop\//, /^\/api\/consultation\//, /^\/api\/quiz-drip\//];
const EXEMPT = [/^\/api\/auth\/email-confirmation/];

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export default () => async (ctx: any, next: () => Promise<void>) => {
  const guarded =
    PROTECTED.some((re) => re.test(ctx.path)) && !EXEMPT.some((re) => re.test(ctx.path));

  if (guarded) {
    const secret = process.env.SITE_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        strapi.log.error('[auth] SITE_SECRET is not set: account endpoints are disabled.');
        ctx.status = 503;
        ctx.body = { error: { status: 503, name: 'ServiceUnavailable', message: 'Unavailable' } };
        return;
      }
      // development without a secret: allow, so local setup stays easy
    } else if (!same(ctx.get('x-site-key') ?? '', secret)) {
      ctx.status = 403;
      ctx.body = { error: { status: 403, name: 'ForbiddenError', message: 'Forbidden' } };
      return;
    }
  }
  await next();
};
