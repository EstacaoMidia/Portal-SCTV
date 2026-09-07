/* SCTV • Sitemap dinâmico — servido em /sitemap.xml (rewrite no vercel.json).
   Mescla páginas fixas reais + matérias com status=publicada (lastmod/priority).
   Domínio canônico: sctvofc.com.br (igual ao robots.txt). */

const SUPABASE_URL = 'https://pqmurfhshztlrztqjqpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-XaLOQn6arnE_PVhCiDGzQ_By2VmRc_';
const SITE = 'https://sctvofc.com.br';
const TODAY = new Date().toISOString().slice(0, 10);

// Somente URLs que EXISTEM de verdade (sem .html — padrão canônico do portal)
const STATIC = [
  ['/', 'hourly', '1.0'],
  ['/programacao/', 'daily', '0.9'],
  ['/contato/', 'monthly', '0.8'],
  ['/categoria/', 'daily', '0.7'],
  ['/sobre/', 'yearly', '0.5'],
  ['/expediente/', 'yearly', '0.4'],
  ['/privacidade/', 'yearly', '0.4'],
  ['/termos/', 'yearly', '0.4'],
  ['/lgpd/', 'yearly', '0.5']
];

const x = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req, res) {
  let rows = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/noticias?status=eq.publicada&select=slug,categoria,updated_at&order=updated_at.desc&limit=1000`,
      { headers: { apikey: SUPABASE_ANON_KEY } }
    );
    if (r.ok) rows = await r.json();
  } catch (e) { /* sem banco: sitemap só com as fixas */ }

  const statics = STATIC.map(
    ([p, f, pr]) => `<url><loc>${SITE}${p}</loc><lastmod>${TODAY}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`
  ).join('');
  const arts = rows
    .filter((n) => n.slug && n.categoria)
    .map(
      (n) => `<url><loc>${SITE}/${x(n.slug)}</loc><lastmod>${String(n.updated_at || TODAY).slice(0, 10)}</lastmod><changefreq>hourly</changefreq><priority>0.8</priority></url>`
    )
    .join('');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${statics}${arts}</urlset>`
  );
}
