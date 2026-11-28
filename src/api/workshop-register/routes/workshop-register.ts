/** Server-only endpoints. Only the website can call these (see the site gate). */
const open = { auth: false as const };

export default {
  routes: [
    { method: 'POST', path: '/workshop-register', handler: 'workshop-register.create', config: open },
    { method: 'GET', path: '/workshop-register/:reference', handler: 'workshop-register.status', config: open },
    { method: 'POST', path: '/workshop-register/:reference/payment', handler: 'workshop-register.attachPayment', config: open },
    { method: 'POST', path: '/workshop-register/:reference/utr', handler: 'workshop-register.submitUtr', config: open },
    { method: 'POST', path: '/workshop-register-pay', handler: 'workshop-register.markPaid', config: open },
    { method: 'POST', path: '/workshop-register-fail', handler: 'workshop-register.markFailed', config: open },
  ],
};
