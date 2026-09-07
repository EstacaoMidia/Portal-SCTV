/* SCTV ads — injeção dinâmica de banners (tabela `banners`).
   Roda na Home e na Matéria. Silencioso: sem linhas ativas, mantém os
   placeholders estáticos. URLs validadas (só https) + DOM API (anti-XSS).
   AdSense (confiável, colado pelo admin) é executado via <script> real. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://pqmurfhshztlrztqjqpk.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_-XaLOQn6arnE_PVhCiDGzQ_By2VmRc_';

  function https(u) {
    u = String(u || '').trim();
    return /^https:\/\/[^ "']+$/i.test(u) ? u : null;
  }

  function buildManual(b, imgClass) {
    var src = https(b.imagem_url);
    if (!src) return null;
    var img = document.createElement('img');
    img.className = imgClass;
    img.src = src;
    img.alt = 'Anúncio SCTV';
    img.loading = 'lazy';
    img.decoding = 'async';
    var link = https(b.link_destino);
    if (!link) return img;
    var a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'sponsored noopener';
    a.setAttribute('aria-label', 'Anúncio patrocinado');
    a.appendChild(img);
    return a;
  }

  function buildAdsense(b, host) {
    if (!b.script_adsense) return null;
    var tmp = document.createElement('div');
    tmp.innerHTML = b.script_adsense;
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(tmp.childNodes).forEach(function (n) {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'SCRIPT') {
        var s = document.createElement('script');
        Array.prototype.slice.call(n.attributes).forEach(function (at) { s.setAttribute(at.name, at.value); });
        s.textContent = n.textContent;
        frag.appendChild(s);
      } else {
        if (n.tagName === 'IFRAME' || n.tagName === 'INS') n.classList.add('dynad-frame');
        frag.appendChild(n);
      }
    });
    if (!frag.childNodes.length) return null;
    host.innerHTML = '';
    host.appendChild(frag);
    return true;
  }

  function applyTo(el, b, imgClass) {
    if (!el || !b || b.ativo === false) return;
    if (b.tipo === 'adsense') { buildAdsense(b, el); return; }
    if (b.tipo === 'manual') {
      var node = buildManual(b, imgClass);
      if (node) { el.innerHTML = ''; el.appendChild(node); }
    }
  }

  async function init() {
    var rows;
    try {
      var r = await fetch(
        SUPABASE_URL + '/rest/v1/banners?ativo=eq.true&select=posicao,tipo,imagem_url,link_destino,script_adsense,ativo',
        { headers: { apikey: SUPABASE_ANON_KEY } }
      );
      if (!r.ok) return;
      rows = await r.json();
    } catch (e) { return; }
    if (!rows || !rows.length) return;
    var map = {};
    rows.forEach(function (b) { map[b.posicao] = b; });

    applyTo(document.querySelector('.header-ad__slot'), map.topo_principal, 'dynad-img dynad-header');
    applyTo(document.querySelector('.ad-box--250'), map.lateral_topo, 'dynad-img dynad-side');
    applyTo(
      document.querySelector('.ad-infeed__slot') || document.querySelector('.ad-inarticle__slot'),
      map.entre_materias, 'dynad-img dynad-infeed'
    );

    // Rodapé: não existe slot fixo no layout → cria sem quebrar a grade
    var rodape = map.rodape;
    if (rodape && rodape.ativo !== false && (rodape.tipo !== 'desativado')) {
      var hasContent = (rodape.tipo === 'manual' && https(rodape.imagem_url)) ||
        (rodape.tipo === 'adsense' && rodape.script_adsense);
      if (hasContent) {
        var footer = document.querySelector('.site-footer');
        if (footer) {
          var wrap = document.createElement('div');
          wrap.className = 'container';
          var box = document.createElement('div');
          box.className = 'ad-footer';
          box.setAttribute('role', 'complementary');
          box.setAttribute('aria-label', 'Publicidade');
          wrap.appendChild(box);
          footer.parentNode.insertBefore(wrap, footer);
          applyTo(box, rodape, 'dynad-img dynad-footer');
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
