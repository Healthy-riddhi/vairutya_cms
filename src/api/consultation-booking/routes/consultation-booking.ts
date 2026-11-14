/** Server-only endpoints. Only the website can call these (see the site gate). */
const open = { auth: false as const };

export default {
  routes: [
    { method: 'GET', path: '/consultation/availability', handler: 'consultation-booking.availability', config: open },
    { method: 'POST', path: '/consultation/requests', handler: 'consultation-booking.create', config: open },
    { method: 'GET', path: '/consultation/requests/:reference', handler: 'consultation-booking.status', config: open },
  ],
};
