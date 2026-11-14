const USERS = 'plugin::users-permissions.user';

const clip = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : undefined;

export default {
  /** Update the signed-in user's name and phone. */
  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const body = ctx.request.body ?? {};
    const data: Record<string, string> = {};
    const fullName = clip(body.fullName, 80);
    const phone = clip(body.phone, 40);
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;

    await strapi.db.query(USERS).update({ where: { id: user.id }, data });
    ctx.body = { ok: true, ...data };
  },

  /** Everything we hold about the signed-in user (data portability). */
  async exportData(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const row = await strapi.db.query(USERS).findOne({ where: { id: user.id } });
    ctx.body = {
      exportedAt: new Date().toISOString(),
      profile: {
        email: row.email,
        fullName: row.fullName ?? '',
        phone: row.phone ?? '',
        confirmed: row.confirmed,
        createdAt: row.createdAt,
      },
    };
  },

  /** Permanently delete the signed-in user's account. */
  async remove(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    await strapi.plugin('users-permissions').service('user').remove({ id: user.id });
    ctx.body = { ok: true };
  },
};
