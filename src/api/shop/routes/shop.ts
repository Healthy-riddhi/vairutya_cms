/**
 * Server-only order endpoints. Only the website can call these (see the site gate),
 * and they work with ids the website has already checked (who is signed in, what was paid).
 */
const open = { auth: false as const };

export default {
  routes: [
    { method: 'POST', path: '/shop/orders', handler: 'shop.create', config: open },
    { method: 'GET', path: '/shop/orders', handler: 'shop.list', config: open },
    { method: 'GET', path: '/shop/orders/:orderNumber', handler: 'shop.detail', config: open },
    { method: 'POST', path: '/shop/orders/:orderNumber/payment', handler: 'shop.attachPayment', config: open },
    { method: 'POST', path: '/shop/orders/:orderNumber/utr', handler: 'shop.submitUtr', config: open },
    { method: 'POST', path: '/shop/pay', handler: 'shop.markPaid', config: open },
    { method: 'POST', path: '/shop/fail', handler: 'shop.markFailed', config: open },
  ],
};
