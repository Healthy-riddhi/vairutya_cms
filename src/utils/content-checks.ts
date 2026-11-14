import { errors } from '@strapi/utils';
import type { Core } from '@strapi/strapi';

const QUIZ = 'api::quiz.quiz';
const AVAIL = 'api::consultation-availability.consultation-availability';
const PAGE = 'api::page.page';

const badTimes = (raw: unknown) =>
  String(raw ?? '')
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !/^([01]?\d|2[0-3]):[0-5]\d$/.test(x));

/** Every answer and every result must name outcomes the quiz really has. */
function checkQuiz(data: any) {
  if (!data || !Array.isArray(data.outcomes)) return;
  const names = data.outcomes.map((o: any) => String(o?.name ?? '').trim()).filter(Boolean);
  const known = new Set(names.map((n: string) => n.toLowerCase()));

  (data.questions ?? []).forEach((q: any, qi: number) => {
    (q?.answers ?? []).forEach((a: any, ai: number) => {
      if (typeof a?.outcomeName === 'string' && !known.has(a.outcomeName.trim().toLowerCase())) {
        throw new errors.ApplicationError(
          `Question ${qi + 1}, answer ${ai + 1}: "${a.outcomeName}" doesn't match any outcome. Use one of: ${names.join(', ')}.`
        );
      }
    });
  });

  (data.results ?? []).forEach((r: any, i: number) => {
    const parts = String(r?.matches ?? '').split('+').map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (!parts.length || parts.some((p) => p !== 'all' && !known.has(p))) {
      throw new errors.ApplicationError(
        `Result ${i + 1}: "${r?.matches ?? ''}" is not valid. Use an outcome name (${names.join(', ')}), a tie such as ${names[0]}+${names[1]}, or the word all.`
      );
    }
  });
}

function checkAvailability(data: any) {
  const groups: [string, any[] | undefined][] = [
    ['Weekly hours', data?.weeklyHours],
    ['Date overrides', data?.overrides],
  ];
  for (const [label, rows] of groups) {
    (rows ?? []).forEach((r: any, i: number) => {
      const bad = badTimes(r?.times);
      if (bad.length) {
        throw new errors.ApplicationError(
          `${label}, row ${i + 1}: "${bad.join('", "')}" is not a valid time. Use 24-hour times like 09:30, separated by commas.`
        );
      }
    });
  }
}

const tokens = (s: string) =>
  [...(s.match(/\{\w+\}/g) ?? []), ...(s.match(/<\/?\w+>/g) ?? [])].sort().join(' ');
const balanced = (s: string) => {
  let d = 0;
  for (const c of s) {
    if (c === '{') d++;
    if (c === '}') d--;
    if (d < 0) return false;
  }
  return d === 0;
};

/** Parts like {name} and <b>…</b> must stay, and match between English and French. */
function checkPage(data: any) {
  (data?.texts ?? []).forEach((r: any) => {
    const { key, en, fr } = r ?? {};
    for (const v of [en, fr]) {
      if (v && !balanced(v)) {
        throw new errors.ApplicationError(`"${key}": the curly brackets { } are not balanced. Parts like {name} must stay exactly as they were.`);
      }
    }
    if (en && fr && tokens(en) !== tokens(fr)) {
      throw new errors.ApplicationError(
        `"${key}": parts like {name} and <b>…</b> must be the same in English and French (English has: ${tokens(en) || 'none'}; French has: ${tokens(fr) || 'none'}).`
      );
    }
  });
}

export function registerContentChecks(strapi: Core.Strapi) {
  (strapi.documents as any).use((ctx: any, next: () => Promise<unknown>) => {
    if (ctx.action === 'create' || ctx.action === 'update') {
      if (ctx.uid === QUIZ) checkQuiz(ctx.params?.data);
      if (ctx.uid === AVAIL) checkAvailability(ctx.params?.data);
      if (ctx.uid === PAGE) checkPage(ctx.params?.data);
    }
    return next();
  });
}
