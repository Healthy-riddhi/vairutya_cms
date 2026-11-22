import type { Core } from '@strapi/strapi';
import { configureAuth } from './bootstrap/auth';
import { seedQuizzes } from './bootstrap/quiz-seed';
import { seedPages } from './bootstrap/pages-seed';
import { seedFrench } from './bootstrap/french-seed';
import { seedFrenchConsultation } from './bootstrap/consultation-french-seed';
import { seedFrenchRecipesAndWorkshops } from './bootstrap/french-seed-2';
import { seedFrenchArticles } from './bootstrap/articles';
import { seedConsultationAvailability } from './bootstrap/consultation-availability-seed';
import { seedConsultationPackages } from './bootstrap/consultation-packages-seed';
import { seedMoreQuizzes } from './bootstrap/quiz-seed-2';
import { seedHairQuizQuestions } from './bootstrap/hair-quiz-questions';
import { seedAntiAcidityProduct } from './bootstrap/anti-acidity-product';
import { seedMeditationMat } from './bootstrap/meditation-mat-product';
import { seedGiftHampers } from './bootstrap/gift-hampers-product';
import { swapQuizCardForWorkshops } from './bootstrap/workshops-card';
import { migrateMediaToCloudinary } from './bootstrap/media-migrate';
import { registerContentChecks } from './utils/content-checks';

// Content types the website may read without logging in (read-only).
const PUBLIC_READ: { uid: string; actions: string[] }[] = [
  { uid: 'api::product.product', actions: ['find', 'findOne'] },
  { uid: 'api::recipe.recipe', actions: ['find', 'findOne'] },
  { uid: 'api::article.article', actions: ['find', 'findOne'] },
  { uid: 'api::workshop.workshop', actions: ['find', 'findOne'] },
  // Single types only have "find"
  { uid: 'api::consultation-page.consultation-page', actions: ['find'] },
  { uid: 'api::shop-setting.shop-setting', actions: ['find'] },
  { uid: 'api::home-hero.home-hero', actions: ['find'] },
  { uid: 'api::quiz.quiz', actions: ['find', 'findOne'] },
  { uid: 'api::page.page', actions: ['find'] },
  { uid: 'api::business-detail.business-detail', actions: ['find'] },
];

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerContentChecks(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // 1. Public role may call find / findOne on the content above
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      for (const { uid, actions } of PUBLIC_READ) {
        for (const action of actions) {
          const name = `${uid}.${action}`;
          const exists = await strapi.db
            .query('plugin::users-permissions.permission')
            .findOne({ where: { action: name, role: publicRole.id } });
          if (!exists) {
            await strapi.db
              .query('plugin::users-permissions.permission')
              .create({ data: { action: name, role: publicRole.id } });
          }
        }
      }
    }

    // 2. French locale (English is the default)
    const fr = await strapi.db
      .query('plugin::i18n.locale')
      .findOne({ where: { code: 'fr' } });
    if (!fr) {
      await strapi
        .plugin('i18n')
        .service('locales')
        .create({ code: 'fr', name: 'French (fr)' });
    }

    // 3. Customer accounts: email confirmation, branded emails, permissions
    await configureAuth(strapi);

    // 4. Create the starter Hair Dosha quiz once, so you can edit it instead of retyping it
    await seedQuizzes(strapi);
    await seedPages(strapi);
    await seedFrench(strapi);
    await seedFrenchConsultation(strapi);
    await seedFrenchRecipesAndWorkshops(strapi);
    await seedFrenchArticles(strapi);
    await seedConsultationAvailability(strapi);
    await seedConsultationPackages(strapi);
    await seedMoreQuizzes(strapi);
    await seedHairQuizQuestions(strapi);
    await seedAntiAcidityProduct(strapi);
    await seedMeditationMat(strapi);
    await seedGiftHampers(strapi);
    await swapQuizCardForWorkshops(strapi);
    await migrateMediaToCloudinary(strapi);
  },
};
