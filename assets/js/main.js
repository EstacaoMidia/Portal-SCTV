/* SCTV - ETAPA 1+2 | Interações do portal */
(function () {
  'use strict';

  // CONFIG — troque pelos IDs reais do canal
  const YOUTUBE = {
    videoId: '', // ex: 'dQw4w9WgXcQ' — deixe vazio para usar live_stream do canal
    channelId: '', // ex: 'UCxxxx' — Descubra em youtube.com/@sctvofc > Sobre
    chatEmbedUrl: '' // ex: 'https://www.youtube.com/live_chat?v=VIDEO_ID&embed_domain=sctvofc.com.br'
  };

  // 1. Data e hora (America/Porto_Velho - Rondônia)
  const dtEl = document.getElementById('currentDateTime');
  function tickClock() {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'America/Porto_Velho'
      });
      const txt = fmt.format(now);
      if (dtEl) {
        dtEl.textContent = txt.charAt(0).toUpperCase() + txt.slice(1) + ' • RO';
        dtEl.setAttribute('datetime', now.toISOString());
      }
    } catch (e) { /* fallback silencioso */ }
  }
  tickClock();
  setInterval(tickClock, 1000);

  // 2b. IndexNow: indexação instantânea Bing/Yandex (Bing Webmaster Tools)
  // Arquivo-chave na raiz: /dbe807132c95a64f4a06f81cd5e29b73.txt
  // Para ativar no Bing: Webmaster Tools > sctvofc.com.br > verificar via arquivo.
  const INDEXNOW_KEY = 'dbe807132c95a64f4a06f81cd5e29b73';
  window.addEventListener('load', () => {
    try {
      if (!/^https?:$/.test(location.protocol)) return; // só em produção
      const url = 'https://api.indexnow.org/IndexNow?url=' + encodeURIComponent(location.href.split('#')[0]) + '&key=' + INDEXNOW_KEY;
      if (navigator.sendBeacon) { navigator.sendBeacon(url); }
      else { fetch(url, { mode: 'no-cors', keepalive: true }).catch(() => {}); }
    } catch (e) { /* silencioso: nunca quebra a página */ }
  }, { once: true });
  // 2. Previsão do tempo via Open-Meteo (grátis, sem key) - Cujubim/RO (sede SCTV)
  const weatherEl = document.getElementById('weatherTemp');
  async function loadWeather() {
    if (!weatherEl) return;
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=-9.36&longitude=-62.58&current=temperature_2m,weather_code&timezone=America%2FPorto_Velho';
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error('http ' + res.status);
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const icon = weatherIcon(code);
      weatherEl.textContent = `Cujubim/RO ${temp}°C ${icon}`;
    } catch (e) {
      // mantém fallback estático já no HTML
    }
  }
  function weatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  }
  loadWeather();
  setInterval(loadWeather, 30 * 60 * 1000);

  // 3. Menu hambúrguer + submenu accordion no mobile
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    // Accordion para submenus no mobile
    nav.querySelectorAll('.has-submenu > .nav-link').forEach((link) => {
      link.addEventListener('click', (ev) => {
        if (window.innerWidth <= 860) {
          ev.preventDefault();
          link.parentElement.classList.toggle('submenu-open');
        }
      });
    });
  }

  // 4. Busca expansível
  const searchBar = document.getElementById('searchBar');
  const btnDesktop = document.getElementById('searchToggle');
  const btnMobile = document.getElementById('searchToggleMobile');
  const btnClose = document.getElementById('searchClose');
  function openSearch() {
    if (!searchBar) return;
    searchBar.hidden = false;
    const input = searchBar.querySelector('input');
    if (input) input.focus();
    if (nav && nav.classList.contains('open') === false && window.innerWidth <= 860) {
      // garante visibilidade: rola até o header
      document.getElementById('siteHeader').scrollIntoView({ behavior: 'smooth' });
    }
  }
  function closeSearch() { if (searchBar) searchBar.hidden = true; }
  if (btnDesktop) btnDesktop.addEventListener('click', () => (searchBar.hidden ? openSearch() : closeSearch()));
  if (btnMobile) btnMobile.addEventListener('click', () => (searchBar.hidden ? openSearch() : closeSearch()));
  if (btnClose) btnClose.addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

  // 5. Sombra do header ao rolar
  const header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 6. Ticker: loop contínuo + controles
  const track = document.getElementById('tickerTrack');
  const ticker = document.querySelector('.ticker');
  if (track && ticker) {
    // Duplica itens para loop -50% perfeito
    track.innerHTML += track.innerHTML;
    const pauseBtn = document.getElementById('tickerPause');
    const prevBtn = document.getElementById('tickerPrev');
    const nextBtn = document.getElementById('tickerNext');
    function togglePause() {
      const paused = ticker.classList.toggle('paused');
      if (pauseBtn) pauseBtn.textContent = paused ? '▶' : '❚❚';
    }
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    // Prev/Next: rolagem manual do viewport
    const viewport = ticker.querySelector('.ticker__viewport');
    if (prevBtn) prevBtn.addEventListener('click', () => viewport.scrollBy({ left: -260, behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => viewport.scrollBy({ left: 260, behavior: 'smooth' }));
    // Pausa automática para leitores de tela / hover já via CSS
    ticker.addEventListener('mouseenter', () => ticker.classList.add('paused'));
    ticker.addEventListener('mouseleave', () => {
      if (pauseBtn && pauseBtn.textContent === '▶') return; // respeita pausa manual
      ticker.classList.remove('paused');
    });
  }

  // 7. Player Ao Vivo: facade click-to-load (performance)
  const facade = document.getElementById('liveFacade');
  const player = document.getElementById('livePlayer');
  function liveSrc() {
    if (YOUTUBE.videoId) return `https://www.youtube.com/embed/${YOUTUBE.videoId}?autoplay=1&rel=0&modestbranding=1`;
    if (YOUTUBE.channelId) return `https://www.youtube.com/embed/live_stream?channel=${YOUTUBE.channelId}&autoplay=1&rel=0`;
    // Fallback: busca live do canal via handle (abre embed de playlist live)
    return 'https://www.youtube.com/embed/live_stream?channel=UCtZe_mYqftyvINN4wBHE5XQ&autoplay=1&rel=0';
  }
  if (facade && player) {
    facade.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = liveSrc();
      iframe.title = 'SCTV Ao Vivo - YouTube';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      player.innerHTML = '';
      player.appendChild(iframe);
    }, { once: true });
  }

  // 8. Chat toggle + compartilhar
  const chatToggle = document.getElementById('chatToggle');
  const chatWrap = document.getElementById('liveChatWrap');
  const chatFrame = document.getElementById('liveChatFrame');
  if (chatToggle && chatWrap) {
    chatToggle.addEventListener('click', () => {
      const hidden = chatWrap.hidden;
      chatWrap.hidden = !hidden;
      chatToggle.setAttribute('aria-expanded', String(hidden));
      if (hidden && chatFrame && !chatFrame.src) {
        chatFrame.src = YOUTUBE.chatEmbedUrl || (YOUTUBE.videoId ? `https://www.youtube.com/live_chat?v=${YOUTUBE.videoId}&embed_domain=${location.hostname}` : '');
        if (!chatFrame.src) {
          chatWrap.innerHTML = '<p style="padding:14px;color:var(--muted);font-size:.85rem">💬 Chat disponível no <a href="https://youtube.com/@sctvofc" target="_blank" rel="noopener" style="color:var(--gold)">YouTube @sctvofc</a> — configure o <code>chatEmbedUrl</code> no main.js para embutir aqui.</p>';
        }
      }
    });
  }
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const data = { title: 'SCTV Ao Vivo', text: 'Assista à SCTV ao vivo — Conectando você ao que realmente importa', url: location.href + '#ao-vivo' };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(data.url);
        shareBtn.textContent = '✅ Link copiado!';
        setTimeout(() => (shareBtn.textContent = '🔗 Compartilhar'), 2000);
      } catch (e) { /* usuário cancelou */ }
    });
  }
  // Contador de viewers (simulado — troque pela API do YouTube quando houver)
  const viewersEl = document.getElementById('liveViewers');
  if (viewersEl) {
    let v = 2400;
    setInterval(() => {
      v += Math.floor(Math.random() * 60 - 25);
      viewersEl.textContent = `🔥 ${(v / 1000).toFixed(1).replace('.', ',')} mil`;
    }, 8000);
  }

  // 9. Tabs Mais lidas / Recentes
  document.querySelectorAll('.tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const key = tab.dataset.tab;
      document.getElementById('tab-lidas').hidden = key !== 'lidas';
      document.getElementById('tab-recentes').hidden = key !== 'recentes';
    });
  });

  // 10. Newsletter + ano
  const form = document.getElementById('newsForm');
  const msg = document.getElementById('newsMsg');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = new FormData(form).get('email');
      if (msg) { msg.textContent = `✅ Obrigado! ${email} inscrito no plantão SCTV.`; msg.style.color = 'var(--green)'; }
      form.reset();
    });
  }
  // 11. CMP cookies LGPD (banner global injetado — vale p/ todas as páginas)
  try {
    if (!localStorage.getItem('sctv_consent')) {
      const banner = document.createElement('div');
      banner.className = 'cookie-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Aviso de cookies');
      banner.innerHTML = '<p>🍪 Usamos cookies para melhorar sua experiência, medir audiência e exibir anúncios (AdSense). Veja a <a href="/privacidade.html">Política de Privacidade</a>.</p><div class="cookie-banner__btns"><button type="button" class="cookie-banner__decline">Recusar</button><button type="button" class="cookie-banner__accept">Aceitar</button></div>';
      document.body.appendChild(banner);
      banner.querySelector('.cookie-banner__accept').addEventListener('click', () => { localStorage.setItem('sctv_consent', 'accepted'); banner.remove(); });
      banner.querySelector('.cookie-banner__decline').addEventListener('click', () => { localStorage.setItem('sctv_consent', 'declined'); banner.remove(); });
    }
  } catch (e) { /* sem localStorage: não exibe */ }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
