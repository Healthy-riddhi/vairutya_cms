// Entry file for Hostinger: starts Strapi in production mode.
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const { createStrapi } = require('@strapi/strapi');

createStrapi({ appDir: process.cwd(), distDir: './dist' }).start();
