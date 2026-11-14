import type { Core } from '@strapi/strapi';

/** Creates the starting availability once. After that, only you change it. */
export async function seedConsultationAvailability(strapi: Core.Strapi) {
  try {
    const docs = (strapi as any).documents('api::consultation-availability.consultation-availability');
    if (await docs.findFirst()) return;
    const times = '09:00, 10:00, 11:00, 14:00, 15:00, 16:00, 17:00';
    await docs.create({
      data: {
        acceptingRequests: true,
        maxDaysAhead: 60,
        minNoticeHours: 24,
        weeklyHours: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((weekday) => ({ weekday, times })),
        overrides: [],
      },
    });
    strapi.log.info('[consultation] created the starting availability (Mon-Sat)');
  } catch (err) {
    strapi.log.error(`[consultation] could not create the starting availability: ${(err as Error).message}`);
  }
}
