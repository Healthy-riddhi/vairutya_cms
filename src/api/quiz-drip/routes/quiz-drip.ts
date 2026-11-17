/** Server-only endpoints. Only the website can call these (see the site gate). */
const open = { auth: false as const };

export default {
  routes: [
    { method: 'POST', path: '/quiz-drip/subscribe', handler: 'quiz-drip.subscribe', config: open },
    { method: 'GET', path: '/quiz-drip/due', handler: 'quiz-drip.due', config: open },
    { method: 'POST', path: '/quiz-drip/claim', handler: 'quiz-drip.claim', config: open },
    { method: 'POST', path: '/quiz-drip/release', handler: 'quiz-drip.release', config: open },
    { method: 'POST', path: '/quiz-drip/stop', handler: 'quiz-drip.stop', config: open },
    { method: 'POST', path: '/quiz-drip/unsubscribe', handler: 'quiz-drip.unsubscribe', config: open },
  ],
};
