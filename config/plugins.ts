import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  // Sends account emails (confirm address, reset password) through Brevo's SMTP relay.
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'localhost'),
        port: env.int('SMTP_PORT', 587),
        secure: env.bool('SMTP_SECURE', false),
        ...(env('SMTP_USERNAME')
          ? { auth: { user: env('SMTP_USERNAME'), pass: env('SMTP_PASSWORD') } }
          : {}),
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'Vairutya <hello@vairutya.com>'),
        defaultReplyTo: env('SMTP_REPLY_TO', 'hello@vairutya.com'),
      },
    },
  },

  // Media storage: Cloudinary when its keys are set, otherwise the local uploads folder
  upload: {
    config: {
      ...(env('CLOUDINARY_NAME')
        ? {
            provider: 'cloudinary',
            providerOptions: {
              cloud_name: env('CLOUDINARY_NAME'),
              api_key: env('CLOUDINARY_KEY'),
              api_secret: env('CLOUDINARY_SECRET'),
            },
            actionOptions: {
              upload: { folder: env('CLOUDINARY_FOLDER', 'vairutya') },
              uploadStream: { folder: env('CLOUDINARY_FOLDER', 'vairutya') },
              delete: {},
            },
          }
        : {}),
    },
  },

  'users-permissions': {
    config: {
      jwt: { expiresIn: '7d' },
      // Strapi sees every customer as the website's one address, so its built-in limit
      // (5 per 5 minutes) would lock everyone out. The website limits per visitor instead;
      // this is only a safety net.
      ratelimit: { enabled: true, interval: { min: 5 }, max: 300 },
      // Extra fields a customer may set when registering
      register: { allowedFields: ['fullName', 'phone'] },
    },
  },
});

export default config;
