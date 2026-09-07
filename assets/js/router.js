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
      .select('slug,categoria,titulo,linha_fina,capa_url,capa_credito,alt_text,video_youtube,galeria,cta_tipo,corpo,autor_nome,created_at,updated_at')
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
  if (img && n.capa_url) { img.src = n.capa_url; img.alt = n.alt_text || n.titulo; }
  const cap = q('.cover figcaption');
  if (cap) cap.textContent = n.capa_credito || 'Foto: Redação SCTV';
  // Corpo: HTML do Quill sanitizado (só YouTube em iframe) ou texto legado
  let html;
  if (/<(p|h2|h3|blockquote|ul|ol)[\s>]/.test(n.corpo || '')) {
    const doc = new DOMParser().parseFromString(n.corpo, 'text/html');
    doc.querySelectorAll('script,style,object,embed').forEach((el) => el.remove());
    // Imagens do Quill: lazy + async + sem estouro (anti-CLS no 4G/5G)
    doc.querySelectorAll('img').forEach((im) => {
      im.setAttribute('loading', 'lazy');
      im.setAttribute('decoding', 'async');
      if (!im.getAttribute('width') || !im.getAttribute('height')) {
        im.setAttribute('style', 'max-width:100%;height:auto;border-radius:10px');
      }
    });
    // YouTube permitido (inclui youtube-nocookie) em wrapper 16:9 responsivo
    doc.querySelectorAll('iframe').forEach((f) => {
      if (!/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)\//.test(f.src || '')) { f.remove(); return; }
      f.setAttribute('loading', 'lazy');
      f.setAttribute('title', 'Vídeo da matéria');
      const wrap = doc.createElement('div');
      wrap.setAttribute('style', 'position:relative;aspect-ratio:16/9;margin:16px 0');
      f.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:10px');
      f.parentNode.insertBefore(wrap, f);
      wrap.appendChild(f);
    });
    doc.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((a) => { if (/^on/i.test(a.name)) el.removeAttribute(a.name); });
    });
    html = doc.body.innerHTML;
  } else {
    const paras = esc(n.corpo).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`);
    paras.splice(2, 0, `<aside class="read-also" aria-label="Leia também"><span>📖 LEIA TAMBÉM</span><a href="/categoria/${esc(n.categoria)}">Mais matérias desta editoria →</a></aside>`);
    html = paras.join('');
  }
  // Vídeo + galeria + CTA do editor premium
  if (n.video_youtube) {
    html += `<div style="position:relative;aspect-ratio:16/9;margin:16px 0"><iframe src="https://www.youtube-nocookie.com/embed/${esc(n.video_youtube)}" title="Vídeo da matéria" loading="lazy" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:10px"></iframe></div>`;
  }
  if (n.galeria) {
    const fotos = n.galeria.split('\n').map((s) => s.trim()).filter(Boolean);
    if (fotos.length) html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:16px 0">` + fotos.map((u) => `<img src="${esc(u)}" alt="${esc(n.titulo)}" width="400" height="300" loading="lazy" decoding="async" style="width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px" />`).join('') + `</div>`;
  }
  const CTAS = {
    vip: ['🚨 Entre no Grupo VIP de Notícias do SCTV no WhatsApp', 'https://chat.whatsapp.com/D86YCp0sfvZ5vOKAxO6Evk', '✅ ENTRAR NO GRUPO VIP AGORA'],
    youtube: ['▶️ Inscreva-se no canal SCTV no YouTube', 'https://youtube.com/@sctvofc?sub_confirmation=1', '✅ INSCREVER-SE AGORA'],
    inscricao: ['📩 Receba o plantão SCTV no seu e-mail', '/#newsForm', '✅ ASSINAR GRÁTIS']
  };
  if (CTAS[n.cta_tipo]) {
    const [t, href, btn] = CTAS[n.cta_tipo];
    html += `<div class="cta-vip" role="complementary"><p class="cta-vip__title">${esc(t)}</p><a class="cta-vip__btn" href="${href}" target="_blank" rel="noopener">${esc(btn)}</a></div>`;
  }
  const body = q('#articleBody');
  if (body) body.innerHTML = html;
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
