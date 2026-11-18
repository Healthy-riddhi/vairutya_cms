import type { Core } from '@strapi/strapi';

const PKG = 'api::consultation-package.consultation-package';
const lines = (...l: string[]) => l.join('\n');

/** The starting packages and prices. Edit or add more under Content Manager → Consultation Package. */
export const PACKAGES = [
  {
    title: 'The Rhythm Reset', slug: 'rhythm-reset', kind: 'base', sortOrder: 10, priceInr: 4900, priceEur: 165,
    includes: lines('Discovery call', '3–5 day custom curation', 'Prakriti & Lifestyle PDF', '7-Day Meal Plan', '7-Day Movement Plan', '2 Follow-up Calls'),
    includesFr: lines('Appel découverte', 'Élaboration sur mesure sur 3 à 5 jours', 'PDF Prakriti & mode de vie', 'Plan de repas sur 7 jours', 'Plan de mouvement sur 7 jours', '2 appels de suivi'),
  },
  {
    title: '21-Day Habit Builder', slug: 'habit-builder-21', kind: 'addon', sortOrder: 20, priceInr: 1500, priceEur: 50,
    includes: 'Replaces the 7-day plan with a 21-day progressive meal structure to lock in digestive rhythm',
    includesFr: 'Remplace le plan de 7 jours par une structure de repas progressive sur 21 jours pour ancrer le rythme digestif',
  },
  {
    title: 'Single-Season Blueprint', slug: 'single-season-blueprint', kind: 'addon', sortOrder: 30, priceInr: 3000, priceEur: 95,
    includes: 'Replaces the 7-day plan with a complete seasonal food & kitchen rotation guide (Ritu-specific)',
    includesFr: 'Remplace le plan de 7 jours par un guide complet de rotation alimentaire et de cuisine saisonnière (propre à chaque Ritu)',
  },
  {
    title: 'Seasonal Shift', slug: 'seasonal-shift-3-months', kind: 'program', months: 3, sortOrder: 40, priceInr: 14500, priceEur: 450,
    idealFor: 'Resetting digestion, energy, or sleep across one full season',
    idealForFr: 'Rééquilibrer la digestion, l’énergie ou le sommeil sur une saison complète',
    includes: lines('Full Prakriti audit', '1 Seasonal Meal & Movement Architecture', '6 bi-weekly check-in calls', 'Priority WhatsApp voice-note support'),
    includesFr: lines('Bilan Prakriti complet', '1 architecture saisonnière repas & mouvement', '6 appels de suivi toutes les deux semaines', 'Soutien prioritaire par messages vocaux WhatsApp'),
  },
  {
    title: 'Deep Alignment', slug: 'deep-alignment-6-months', kind: 'program', months: 6, sortOrder: 50, priceInr: 26000, priceEur: 820,
    idealFor: 'Sustainable weight balance, hormonal rhythm, or chronic burnout recovery',
    idealForFr: 'Équilibre de poids durable, rythme hormonal ou récupération d’un épuisement chronique',
    includes: lines('Everything in 3 Months', '2 full seasonal protocol transitions', '12 bi-weekly calls', 'Mid-point lifestyle recalibration'),
    includesFr: lines('Tout ce qui est inclus dans 3 mois', '2 transitions complètes de protocole saisonnier', '12 appels toutes les deux semaines', 'Recalibrage du mode de vie à mi-parcours'),
  },
  {
    title: 'Full-Year Mastery', slug: 'full-year-mastery-12-months', kind: 'program', months: 12, sortOrder: 60, priceInr: 48000, priceEur: 1490,
    idealFor: 'Year-round preventive health across every seasonal shift',
    idealForFr: 'Santé préventive toute l’année, à chaque changement de saison',
    includes: lines('Complete 4-to-6 season custom meal & lifestyle protocols', '24 calls (2/month)', 'Travel/festival dining guides', 'Complimentary Vairutya ritual welcome box'),
    includesFr: lines('Protocoles repas & mode de vie complets sur 4 à 6 saisons', '24 appels (2 par mois)', 'Guides pour manger en voyage et pendant les fêtes', 'Coffret de bienvenue rituel Vairutya offert'),
  },
];

/** Adds the packages once. After that they are yours to edit; deleting one here won't bring it back. */
export async function seedConsultationPackages(strapi: Core.Strapi) {
  try {
    const store = strapi.store({ type: 'plugin', name: 'vairutya', key: 'consultation-packages-seeded' });
    if (await store.get()) return;
    const docs = (strapi as any).documents(PKG);
    if ((await docs.count({})) === 0) {
      for (const data of PACKAGES) await docs.create({ data: { ...data, active: true } });
      strapi.log.info(`[consultation] added ${PACKAGES.length} starting packages`);
    }
    await store.set({ value: true });
  } catch (err) {
    strapi.log.error(`[consultation] could not add the starting packages: ${(err as Error).message}`);
  }
}
