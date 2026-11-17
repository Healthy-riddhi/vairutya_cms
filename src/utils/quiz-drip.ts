/**
 * The schedule of the skin-quiz emails: email 1 goes out 3 days after the quiz, email 2 after 7,
 * and so on. The wording of the emails lives on the website (src/lib/skin-sequences.ts).
 */
export const DAYS = [3, 7, 10, 14, 21];
export const STEPS = DAYS.length;

/** Never send two emails closer together than this, even if someone confirmed their email late. */
const MIN_GAP_HOURS = 44; // a little under two days, so a daily job that runs a bit earlier still counts

export const SEQUENCES = ['vata', 'pitta', 'kapha', 'vata-pitta', 'vata-kapha', 'pitta-kapha', 'tridoshic'];

const DAY_MS = 86_400_000;

/** True when the next email for this subscriber is ready to go. */
export function isDue(s: any, now = Date.now()): boolean {
  if (s.status !== 'active' || !(s.nextStep >= 1 && s.nextStep <= STEPS) || !s.startedAt) return false;
  const dueAt = new Date(s.startedAt).getTime() + DAYS[s.nextStep - 1] * DAY_MS;
  if (now < dueAt - 2 * 3_600_000) return false; // job may run a couple of hours early; fine
  if (s.lastSentAt && now - new Date(s.lastSentAt).getTime() < MIN_GAP_HOURS * 3_600_000) return false;
  return true;
}
