/**
 * Adds profile fields to customer accounts (Strapi's built-in "user").
 */
export default (plugin: any) => {
  plugin.contentTypes.user.schema.attributes.fullName = {
    type: 'string',
    maxLength: 80,
  };
  plugin.contentTypes.user.schema.attributes.phone = {
    type: 'string',
    maxLength: 40,
  };
  return plugin;
};
