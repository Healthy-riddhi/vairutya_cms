import type { Core } from '@strapi/strapi';
import { addFrenchArticle } from './helper';
import { hair } from './hair';
import { scrape } from './scrape';
import { oil } from './oil';
import { astrology } from './astrology';

export async function seedFrenchArticles(strapi: Core.Strapi) {
  for (const a of [hair, scrape, oil, astrology]) await addFrenchArticle(strapi, a);
}
