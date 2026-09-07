/* SCTV Edge Middleware — OG dinâmico para crawlers sociais (WhatsApp/FB/X).
   Matcher (abaixo): SOMENTE /noticias/*. Humanos passam direto com custo zero
   (return undefined). Bots recebem o HTML de /single com og:title, og:description,
   og:image, og:url, canonical e <title> injetados da tabela `noticias`
   (status=publicada). Crawlers não executam JS — por isso o patch é no edge. */

export const config = { matcher: '/noticias/:path*' };

const SUPABASE_URL = 'https://pqmurfhshztlrztqjqpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-XaLOQn6arnE_PVhCiDGzQ_By2VmRc_';
const SITE = 'https://sctvofc.com.br';
const BOT_RE = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|telegrambot|discordbot|slackbot|embedly|quora|pinterest/i;

const attr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default async function middleware(req) {
  const ua = req.headers.get('user-agent') || '';
  if (!BOT_RE.test(ua)) return undefined; // humano: segue o fluxo normal

  const url = new URL(req.url);
  const slug = decodeURIComponent(url.pathname.replace(/\/+$/, '').split('/').pop() || '');

  let row = null;
  try {
    const api = `${SUPABASE_URL}/rest/v1/noticias?slug=eq.${encodeURIComponent(slug)}&status=eq.publicada&select=titulo,linha_fina,capa_url,og_image,categoria,slug`;
    const r = await fetch(api, { headers: { apikey: SUPABASE_ANON_KEY } });
    if (r.ok) {
      const arr = await r.json();
      row = arr[0] || null;
    }
  } catch (e) { /* sem banco: entrega shell genérico */ }
  if (!row) return undefined; // slug fora do banco: shell estático (router mostra "não encontrada")

  let html;
  try {
    const origin = await fetch(new URL('/single', url));
    html = await origin.text();
  } catch (e) {
    return undefined;
  }

  const canon = `${SITE}/noticias/${row.categoria}/${row.slug}`;
  const title = attr(row.titulo);
  const desc = attr((row.linha_fina || '').slice(0, 200));
  const img = attr(row.og_image || row.capa_url || `${SITE}/assets/img/logo-sctv.webp`);

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title} | SCTV</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s?\/?>/, `<link rel="canonical" href="${canon}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s?\/?>/, `<meta property="og:url" content="${canon}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s?\/?>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s?\/?>/, `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s?\/?>/, `<meta property="og:image" content="${img}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s?\/?>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s?\/?>/, `<meta name="twitter:description" content="${desc}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s?\/?>/, `<meta name="twitter:image" content="${img}" />`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=300, s-maxage=600'
    }
  });
}
