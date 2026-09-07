/* SCTV single — progresso, leitura, share, vídeo, comentários (ultraleve) */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);

  // 1. Reading progress bar (rAF, sem jank)
  const bar = $('#readingBar');
  const article = $('#articleBody');
  let ticking = false;
  function updateProgress() {
    ticking = false;
    if (!bar || !article) return;
    const rect = article.getBoundingClientRect();
    const total = article.offsetHeight - window.innerHeight + 200;
    const read = Math.min(Math.max(-rect.top + 200, 0), Math.max(total, 1));
    bar.style.width = (total > 0 ? (read / total) * 100 : 0).toFixed(2) + '%';
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();

  // 2. Tempo de leitura real (200 ppm) + badge
  const rt = $('#readTime');
  if (rt && article) {
    const words = article.innerText.trim().split(/\s+/).length;
    rt.textContent = Math.max(2, Math.round(words / 200)) + ' min';
  }

  // 3. Copiar link (todos os botões copy)
  const pageUrl = 'https://sctvofc.com.br/noticias/cujubim-reviravolta-decisao-ultima-hora/';
  async function copyLink(btn) {
    try {
      await navigator.clipboard.writeText(pageUrl);
      const old = btn.textContent;
      btn.textContent = '✅ Copiado!';
      setTimeout(() => (btn.textContent = old), 2000);
      bumpShares();
    } catch (e) {
      prompt('Copie o link da matéria:', pageUrl);
    }
  }
  ['#copyTop', '#copyRail', '#copyBottom', '#copyMobile'].forEach((sel) => {
    const b = $(sel);
    if (b) b.addEventListener('click', () => copyLink(b));
  });

  // 4. Contador social simples (prova social)
  let shares = 1240;
  function bumpShares() {
    shares += 1;
    const el = $('#shareCount');
    if (el) el.textContent = shares >= 1000 ? (shares / 1000).toFixed(1).replace('.', ',') + ' mil' : String(shares);
  }
  document.querySelectorAll('.share--wa,.share--fb').forEach((a) => a.addEventListener('click', bumpShares));

  // 5. Vídeo facade → YouTube SCTV (troque VIDEO_ID)
  const vf = $('#videoFacade');
  if (vf) {
    vf.addEventListener('click', () => {
      const wrap = vf.closest('.video-embed');
      const iframe = document.createElement('iframe');
      // TODO: trocar pelo ID da reportagem real no canal @sctvofc
      iframe.src = 'https://www.youtube.com/embed/live_stream?channel=UCtZe_mYqftyvINN4wBHE5XQ&autoplay=1&rel=0';
      iframe.title = 'Reportagem SCTV em vídeo';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
      wrap.style.cssText = 'position:relative;aspect-ratio:16/9';
      wrap.innerHTML = '';
      wrap.appendChild(iframe);
    }, { once: true });
  }

  // 6. Comentários locais (sem backend — localStorage)
  const form = $('#commentForm');
  const list = $('#commentList');
  const countEls = [$('#commentCount'), $('#commentCountTop')].filter(Boolean);
  const KEY = 'sctv_comments_cujubim';
  function renderCount() {
    if (!list) return;
    countEls.forEach((el) => (el.textContent = String(list.children.length + 35)));
  }
  function loadSaved() {
    if (!list) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      saved.forEach((c) => prependComment(c.nome, c.texto, 'agora mesmo'));
    } catch (e) {}
    renderCount();
  }
  function prependComment(nome, texto, quando) {
    const li = document.createElement('li');
    const safe = (s) => s.replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));
    li.innerHTML = `<strong>${safe(nome)}</strong><span>${safe(quando)}</span><p>${safe(texto)}</p>`;
    list.prepend(li);
  }
  if (form && list) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nome = String(fd.get('nome') || '').slice(0, 60);
      const texto = String(fd.get('texto') || '').slice(0, 500);
      if (!nome || !texto) return;
      prependComment(nome, texto, 'agora mesmo');
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
        saved.unshift({ nome, texto });
        localStorage.setItem(KEY, JSON.stringify(saved.slice(0, 20)));
      } catch (err) {}
      form.reset();
      renderCount();
    });
    loadSaved();
  }
})();
