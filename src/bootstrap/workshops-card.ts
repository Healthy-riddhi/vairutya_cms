import type { Core } from '@strapi/strapi';

const EN = {
  name: 'Join a workshop',
  description: 'Guided, hands-on sessions rooted in Ayurveda and modern wellness.',
  buttonLabel: 'Explore',
  link: '/workshops',
};
const FR = {
  name: 'Rejoindre un atelier',
  description: 'Des expériences guidées, ancrées dans l’Ayurveda et le bien-être moderne.',
  buttonLabel: 'Explorer',
  link: '/workshops',
};

// Every card that used to send people back to the quiz list.
const OLD_EN = ['Take another quiz', 'Guided Full Assessment'];
const OLD_FR = ['Faire un autre quiz', 'Bilan complet guidé'];

/**
 * One-off: swaps the "Take another quiz" suggestion card on every quiz result
 * (English and French, draft and published) for a link to the workshops page.
 * Images you added to a card in the admin are kept.
 */
export async function swapQuizCardForWorkshops(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'quiz-card-workshops' });
    if (await store.get()) return;

    const q = strapi.db.query('quiz.suggestion');
    const en = await q.updateMany({ where: { name: { $in: OLD_EN } }, data: EN });
    const fr = await q.updateMany({ where: { name: { $in: OLD_FR } }, data: FR });

    await store.set({ value: true });
    strapi.log.info(`[quiz] swapped the quiz card for workshops (${en?.count ?? 0} English, ${fr?.count ?? 0} French)`);
  } catch (err) {
    strapi.log.error(`[quiz] could not swap the quiz card: ${(err as Error).message}`);
  }
}
