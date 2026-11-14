/**
 * Self-service account endpoints. Each one only ever touches the signed-in user
 * (taken from their login token), never an id supplied by the caller.
 */
export default {
  routes: [
    { method: 'PUT', path: '/account/profile', handler: 'account.updateProfile', config: {} },
    { method: 'GET', path: '/account/export', handler: 'account.exportData', config: {} },
    { method: 'DELETE', path: '/account', handler: 'account.remove', config: {} },
  ],
};
