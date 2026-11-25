/** Server-only endpoint. Only the website can call it (see the site gate). */
export default {
  routes: [{ method: 'POST', path: '/workshop-register', handler: 'workshop-register.create', config: { auth: false as const } }],
};
