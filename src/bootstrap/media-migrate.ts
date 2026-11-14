import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const FILE = 'plugin::upload.file';

/** One-off: copies every locally stored upload to Cloudinary. Runs only with MIGRATE_MEDIA=true. */
export async function migrateMediaToCloudinary(strapi: Core.Strapi) {
  if (process.env.MIGRATE_MEDIA !== 'true') return;
  try {
    if ((strapi.config.get('plugin::upload.provider') as string) !== 'cloudinary') {
      strapi.log.error('[media] Cloudinary is not active. Check the CLOUDINARY_ values in .env.');
      return;
    }
    const provider = (strapi.plugin('upload') as any).provider;
    const publicDir: string = (strapi as any).dirs?.static?.public ?? path.join(process.cwd(), 'public');

    const push = async (meta: any) => {
      const file = path.join(publicDir, String(meta.url).replace(/^\//, ''));
      if (!fs.existsSync(file)) throw new Error(`file not found: ${file}`);
      const f: any = { name: meta.name, hash: meta.hash, ext: meta.ext, mime: meta.mime, size: meta.size, buffer: fs.readFileSync(file) };
      await provider.upload(f);
      if (!f.url) throw new Error('Cloudinary returned no address');
      return { url: f.url as string, provider_metadata: f.provider_metadata };
    };

    const files: any[] = await strapi.db.query(FILE).findMany({ where: { provider: 'local' }, limit: 10000 });
    strapi.log.info(`[media] ${files.length} local files to copy`);
    let done = 0;
    for (const f of files) {
      try {
        const main = await push(f);
        const formats = f.formats ? { ...f.formats } : null;
        for (const k of Object.keys(formats ?? {})) {
          const r = await push(formats![k]);
          formats![k] = { ...formats![k], url: r.url, provider_metadata: r.provider_metadata };
        }
        await strapi.db.query(FILE).update({
          where: { id: f.id },
          data: { url: main.url, provider: 'cloudinary', provider_metadata: main.provider_metadata, formats },
        });
        done++;
      } catch (e) {
        strapi.log.warn(`[media] ${f.name}: ${(e as Error).message}`);
      }
    }
    strapi.log.info(`[media] copied ${done} of ${files.length} files. You can now stop Strapi and run it normally.`);
  } catch (err) {
    strapi.log.error(`[media] migration failed: ${(err as Error).message}`);
  }
}
