/* SCTV router — resolve /noticias/:categoria/:slug no layout do portal (MPA).
   Não é SPA: cada página continua sendo um HTML próprio com SEO individual.
   Este módulo só atua dentro de single.html quando a URL é uma rota /noticias/*.
   Escuta DOMContentLoaded + popstate. Slugs desconhecidos → tela amigável
   "Notícia não encontrada" dentro do layout (sem 404 nativo da Vercel). */
import { supabase } from './supabaseClient.js';

// URL canônica da matéria-modelo publicada (a única com conteúdo real hoje).
const CANONICAL_PATH = '/noticias/cujubim-reviravolta-decisao-ultima-hora';

const norm = (p) => (p.replace(/\/+$/, '') || '/');

function parseNoticia(pathname) {
  const clean = norm(pathname);
  const m2 = clean.match(/^\/noticias\/([^/]+)\/([^/]+)$/);
  if (m2) return { categoria: decodeURIComponent(m2[1]), slug: decodeURIComponent(m2[2]) };
  const m1 = clean.match(/^\/noticias\/([^/]+)$/);
  if (m1) return { categoria: null, slug: decodeURIComponent(m1[1]) };
  return null;
}

/* Quando existir a tabela `noticias` (colunas slug, categoria, publicada),
   este stub passa a resolver de verdade — hoje cai no mock abaixo. */
async function existsInSupabase(slug) {
  try {
    const { data } = await supabase.from('noticias').select('slug').eq('slug', slug).maybeSingle();
    return !!data;
  } catch (e) {
    return false; // tabela ainda não existe: segue para o registro local
  }
}

function renderNotFound(categoria, slug) {
  const article = document.getElementById('article');
  const panel = document.getElementById('noticiaNaoEncontrada');
  if (article) article.hidden = true;
  if (panel) {
    panel.hidden = false;
    const slugEl = panel.querySelector('[data-slug]');
    if (slugEl) slugEl.textContent = [categoria, slug].filter(Boolean).join(' / ');
  }
  document.title = 'Notícia não encontrada | SCTV Cujubim/RO';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function route() {
  const path = norm(window.location.pathname);
  if (!path.startsWith('/noticias/')) return; // fora do escopo: nada a fazer
  if (path === CANONICAL_PATH) return; // matéria real: render estático normal

  const parsed = parseNoticia(path);
  if (!parsed) return;
  if (await existsInSupabase(parsed.slug)) return; // futura tabela resolveu

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderNotFound(parsed.categoria, parsed.slug), { once: true });
  } else {
    renderNotFound(parsed.categoria, parsed.slug);
  }
}

document.addEventListener('DOMContentLoaded', route);
window.addEventListener('popstate', route);
route();
