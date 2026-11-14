import type { Core } from '@strapi/strapi';

const PERM = 'plugin::users-permissions.permission';
const ROLE = 'plugin::users-permissions.role';

/** Public address of the website (where account emails send people). */
const frontend = () => (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const INK = '#1c1c1c';
const TEAL = '#003b43';
const CLAY = '#9b4a3a';
const MUTED = '#6b6b63';

function emailShell(heading: string, inner: string) {
  return `<div style="margin:0;padding:32px 16px;background:#f5f1ea;font-family:Georgia,'Times New Roman',serif;color:${INK};">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px 36px;">
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.3em;color:${CLAY};">VAIRUTYA</p>
<h1 style="margin:0 0 20px;font-size:26px;font-weight:normal;line-height:1.25;color:${TEAL};">${heading}</h1>
${inner}
</div>
<p style="max-width:560px;margin:20px auto 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">Vairutya · <a href="https://www.vairutya.com" style="color:${MUTED};">www.vairutya.com</a></p>
</div>`;
}

const p = (html: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${html}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:28px 0;"><a href="${href}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.04em;padding:14px 30px;border-radius:999px;">${label}</a></p>`;
const small = (html: string) =>
  `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MUTED};word-break:break-all;">${html}</p>`;

// Strapi fills in <%= … %> when it sends the email.
const CONFIRM_URL = '<%= URL %>?confirmation=<%= CODE %>';
const RESET_URL = '<%= URL %>?code=<%= TOKEN %>';
const GREETING = 'Hi <%= USER.fullName %>,';

const confirmationMessage = emailShell(
  'Confirm your email',
  p(GREETING) +
    p('Welcome to Vairutya. Please confirm your email address to activate your account.') +
    button(CONFIRM_URL, 'Confirm my email') +
    small(`If the button doesn’t work, copy this link into your browser:<br>${CONFIRM_URL}`) +
    small('Didn’t create an account? You can ignore this email.')
);

const resetMessage = emailShell(
  'Reset your password',
  p(GREETING) +
    p('We received a request to reset the password for your Vairutya account. This link works for a short time.') +
    button(RESET_URL, 'Choose a new password') +
    small(`If the button doesn’t work, copy this link into your browser:<br>${RESET_URL}`) +
    small('Didn’t ask for this? Ignore this email. Your password won’t change.')
);

/**
 * Configures customer accounts: email confirmation, where links point, branded
 * emails, and exactly which actions a signed-in customer may perform.
 */
export async function configureAuth(strapi: Core.Strapi) {
  const smtpReady = Boolean(process.env.SMTP_HOST);
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && !smtpReady) {
    strapi.log.error(
      '[auth] SMTP_HOST is not set: account emails cannot be sent, so nobody will be able to confirm their email or reset a password.'
    );
  }
  // In production confirmation is always required. In development it is only switched
  // on once SMTP is configured, so you can still sign up locally without email set up.
  const requireConfirmation = isProd || smtpReady;
  if (!requireConfirmation) {
    strapi.log.warn('[auth] SMTP_HOST not set: email confirmation is OFF (development only).');
  }

  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });

  const advanced: any = (await store.get({ key: 'advanced' })) ?? {};
  await store.set({
    key: 'advanced',
    value: {
      ...advanced,
      unique_email: true,
      allow_register: true,
      default_role: 'authenticated',
      email_confirmation: requireConfirmation,
      email_confirmation_redirection: `${frontend()}/login?confirmed=1`,
      email_reset_password: `${frontend()}/reset-password`,
    },
  });

  const fromEmail = process.env.SMTP_FROM_EMAIL ?? 'hello@vairutya.com';
  const templates: any = (await store.get({ key: 'email' })) ?? {};
  const from = { name: 'Vairutya', email: fromEmail };
  await store.set({
    key: 'email',
    value: {
      ...templates,
      email_confirmation: {
        ...(templates.email_confirmation ?? { display: 'Email.template.email_confirmation', icon: 'check-square' }),
        options: { from, response_email: fromEmail, object: 'Confirm your Vairutya account', message: confirmationMessage },
      },
      reset_password: {
        ...(templates.reset_password ?? { display: 'Email.template.reset_password', icon: 'sync' }),
        options: { from, response_email: fromEmail, object: 'Reset your Vairutya password', message: resetMessage },
      },
    },
  });

  // ---- What a signed-in customer may do -------------------------------------
  const authed = await strapi.db.query(ROLE).findOne({ where: { type: 'authenticated' } });
  const pub = await strapi.db.query(ROLE).findOne({ where: { type: 'public' } });

  if (authed) {
    const allow = [
      'plugin::users-permissions.user.me',
      'plugin::users-permissions.auth.changePassword',
      'api::account.account.updateProfile',
      'api::account.account.exportData',
      'api::account.account.remove',
    ];
    for (const action of allow) {
      const has = await strapi.db.query(PERM).findOne({ where: { action, role: authed.id } });
      if (!has) await strapi.db.query(PERM).create({ data: { action, role: authed.id } });
    }
  }

  // Never let customers (or visitors) list, read, create, edit or delete OTHER users.
  const dangerous = ['find', 'findOne', 'count', 'create', 'update', 'destroy'].map(
    (a) => `plugin::users-permissions.user.${a}`
  );
  for (const role of [authed, pub].filter(Boolean)) {
    for (const action of dangerous) {
      await strapi.db.query(PERM).deleteMany({ where: { action, role: role.id } });
    }
  }
}
