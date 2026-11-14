/** Small branded email pieces for emails sent from Strapi (e.g. "your order has shipped"). */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const shell = (heading: string, inner: string) => `<div style="margin:0;padding:32px 16px;background:#f5f1ea;font-family:Georgia,'Times New Roman',serif;color:#1c1c1c;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px 36px;">
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.3em;color:#9b4a3a;">VAIRUTYA</p>
<h1 style="margin:0 0 20px;font-size:26px;font-weight:normal;line-height:1.25;color:#003b43;">${esc(heading)}</h1>
${inner}
</div></div>`;

export const para = (html: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${html}</p>`;
export { esc };
