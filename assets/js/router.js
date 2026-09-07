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

/* Retorna a linha publicada ou null (tabela `noticias` do noticias.sql). */
async function fetchNoticia(slug) {
  try {
    const { data } = await supabase
      .from('noticias')
      .select('slug,categoria,titulo,linha_fina,capa_url,capa_credito,corpo,autor_nome,created_at,updated_at')
      .eq('slug', slug)
      .eq('status', 'publicada')
      .maybeSingle();
    return data || null;
  } catch (e) {
    return null; // tabela ainda não criada ou RLS: cai no mock/404 amigável
  }
}

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));

/* Injeta a matéria do banco no template single.html (ids/classes existentes). */
function renderNoticia(n) {
  const q = (s) => document.querySelector(s);
  const h1 = q('.article-title');
  if (h1) h1.textContent = n.titulo;
  const dek = q('.article-dek');
  if (dek) dek.textContent = n.linha_fina || '';
  const img = q('.cover img');
  if (img && n.capa_url) { img.src = n.capa_url; img.alt = n.titulo; }
  const cap = q('.cover figcaption');
  if (cap) cap.textContent = n.capa_credito || 'Foto: Redação SCTV';
  const paras = esc(n.corpo).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`);
  paras.splice(2, 0, `<aside class="read-also" aria-label="Leia também"><span>📖 LEIA TAMBÉM</span><a href="/categoria/${esc(n.categoria)}">Mais matérias desta editoria →</a></aside>`);
  const body = q('#articleBody');
  if (body) body.innerHTML = paras.join('');
  const t = q('.byline__info time');
  if (t && n.created_at) {
    const d = new Date(n.created_at);
    t.textContent = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    t.setAttribute('datetime', n.created_at);
  }
  const kick = q('.kicker-cat');
  if (kick) kick.textContent = `${n.categoria.toUpperCase()} • SCTV`;
  document.title = `${n.titulo.slice(0, 65)} | SCTV`;
  window.scrollTo({ top: 0 });
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
  if (path === CANONICAL_PATH) return; // matéria-modelo: render estático (LCP + SEO intactos)

  const parsed = parseNoticia(path);
  if (!parsed) return;
  const row = await fetchNoticia(parsed.slug);
  const apply = () => (row ? renderNoticia(row) : renderNotFound(parsed.categoria, parsed.slug));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
}

document.addEventListener('DOMContentLoaded', route);
window.addEventListener('popstate', route);
route();
