/* SCTV ETAPA 4 — grade interativa + formulário validado (defer, sem dependências) */
(function () {
  'use strict';

  // --- Grade de programação: dados por dia (Hora de Rondônia) ---
  const GRID = {
    seg: [['06:00', 'Bom Dia Cujubim', 'Notícias locais + previsão', 'ao-vivo'], ['12:00', 'Jornal SCTV Meio-Dia', 'RO, Brasil e Mundo', 'ao-vivo'], ['13:00', 'Agro & Negócios', 'Safra, boi gordo, café', 'agro'], ['18:00', 'Esporte Total RO', 'Estadual e várzea', 'esporte'], ['18:30', 'SCTV Notícias Noite', 'Edição principal', 'ao-vivo'], ['20:00', 'SCTV Show', 'Variedades e famosos', 'gold']],
    ter: [['06:00', 'Bom Dia Cujubim', 'Notícias locais + previsão', 'ao-vivo'], ['12:00', 'Jornal SCTV Meio-Dia', 'RO, Brasil e Mundo', 'ao-vivo'], ['13:00', 'Agro & Negócios', 'Mercado e clima', 'agro'], ['18:30', 'SCTV Notícias Noite', 'Edição principal', 'ao-vivo'], ['20:00', 'SCTV Entrevista', 'Política e economia', 'gold']],
    qua: [['06:00', 'Bom Dia Cujubim', 'Notícias locais + previsão', 'ao-vivo'], ['12:00', 'Jornal SCTV Meio-Dia', 'RO, Brasil e Mundo', 'ao-vivo'], ['13:00', 'Agro & Negócios', 'Café robusta e soja', 'agro'], ['18:30', 'SCTV Notícias Noite', 'Edição principal', 'ao-vivo'], ['20:00', 'SCTV Show', 'Cultura e estilo de vida', 'gold']],
    qui: [['06:00', 'Bom Dia Cujubim', 'Notícias locais + previsão', 'ao-vivo'], ['12:00', 'Jornal SCTV Meio-Dia', 'RO, Brasil e Mundo', 'ao-vivo'], ['18:30', 'SCTV Notícias Noite', 'Edição principal', 'ao-vivo'], ['20:00', 'Esporte Total RO', 'Mesa redonda', 'esporte']],
    sex: [['06:00', 'Bom Dia Cujubim', 'Notícias locais + previsão', 'ao-vivo'], ['12:00', 'Jornal SCTV Meio-Dia', 'RO, Brasil e Mundo', 'ao-vivo'], ['13:00', 'Agro & Negócios', 'Fechamento da semana', 'agro'], ['18:30', 'SCTV Notícias Noite', 'Edição principal', 'ao-vivo'], ['20:00', 'Sextou SCTV', 'Música e variedades', 'gold']],
    sab: [['08:00', 'SCTV Rural', 'Agro do fim de semana', 'agro'], ['12:00', 'SCTV Notícias Sabadão', 'Resumo RO', 'ao-vivo'], ['18:00', 'Esporte Total RO', 'Rodada + várzea', 'esporte'], ['20:00', 'SCTV Show Retrô', 'Famosos e cultura', 'gold']],
    dom: [['09:00', 'Cujubim em Foco', 'Comunidade e igreja', 'gold'], ['12:00', 'SCTV Notícias Domingo', 'Resumo nacional', 'ao-vivo'], ['18:00', 'Esporte Total RO', 'Gols da rodada', 'esporte'], ['20:00', 'Cinema SCTV', 'Sessão da noite', 'gold']]
  };
  const DAYS = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

  const tabs = document.getElementById('dayTabs');
  const list = document.getElementById('slotList');
  const nowLabel = document.getElementById('nowLabel');

  function todayKey() {
    try {
      const wd = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'America/Porto_Velho' }).format(new Date()).replace('.', '').toLowerCase();
      return { seg: 'seg', ter: 'ter', qua: 'qua', qui: 'qui', sex: 'sex', sáb: 'sab', sab: 'sab', dom: 'dom' }[wd] || 'seg';
    } catch (e) { return 'seg'; }
  }
  function nowHM() {
    try {
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Porto_Velho' }).format(new Date());
    } catch (e) { return '12:00'; }
  }
  function renderDay(key) {
    if (!list) return;
    const slots = GRID[key] || [];
    const hm = key === todayKey() ? nowHM() : null;
    let liveIdx = -1;
    if (hm) {
      slots.forEach((s, i) => {
        const next = slots[i + 1] ? slots[i + 1][0] : '23:59';
        if (s[0] <= hm && hm < next) liveIdx = i;
      });
    }
    list.innerHTML = slots.map((s, i) => {
      const live = i === liveIdx;
      const tagCls = s[3] === 'ao-vivo' ? 'tag--live' : s[3] === 'agro' ? 'tag--agro' : 'tag--gold';
      const tagTxt = s[3] === 'ao-vivo' ? '● AO VIVO' : s[1].toUpperCase().includes('AGRO') || s[3] === 'agro' ? 'AGRO' : 'SCTV';
      return `<li class="slot${live ? ' live-now' : ''}"><time>${s[0]}</time><div><strong>${s[1]}${live ? ' — NO AR AGORA' : ''}</strong><small>${s[2]} • Cujubim/RO</small></div><span class="tag ${tagCls}">${tagTxt}</span></li>`;
    }).join('');
    if (nowLabel) {
      nowLabel.textContent = key === todayKey()
        ? (liveIdx >= 0 ? `No ar agora: ${slots[liveIdx][1]} • ${slots[liveIdx][0]} (hora de RO)` : `Hoje em Cujubim/RO • agora ${hm}`)
        : `${DAYS[key]} • grade completa de Cujubim/RO`;
    }
    if (tabs) tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.day === key)));
  }
  if (tabs && list) {
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-day]');
      if (b) renderDay(b.dataset.day);
    });
    renderDay(todayKey());
  }

  // --- Player facade (programação) ---
  const facade = document.getElementById('liveFacade');
  const player = document.getElementById('livePlayer');
  if (facade && player) {
    facade.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/live_stream?channel=UCtZe_mYqftyvINN4wBHE5XQ&autoplay=1&rel=0';
      f.title = 'SCTV Ao Vivo — YouTube';
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      player.innerHTML = '';
      player.appendChild(f);
    }, { once: true });
  }

  // --- Formulário contato/anuncie com validação ---
  const form = document.getElementById('contactForm');
  if (form) {
    const fields = {
      nome: (v) => v.trim().length >= 3 || 'Informe seu nome completo.',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'E-mail inválido.',
      zap: (v) => v.trim() === '' || /^[()\d\s-]{8,}$/.test(v) || 'WhatsApp inválido. Ex: (69) 98406-2398',
      assunto: (v) => v !== '' || 'Escolha um assunto.',
      msg: (v) => v.trim().length >= 20 || 'Conte um pouco mais (mín. 20 caracteres).'
    };
    function validate(name) {
      const input = form.elements[name];
      const wrap = input.closest('.field');
      const msg = wrap.querySelector('.err');
      const res = fields[name](input.value);
      const ok = res === true;
      wrap.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (msg) msg.textContent = ok ? '' : res;
      return ok;
    }
    Object.keys(fields).forEach((n) => {
      const el = form.elements[n];
      if (el) el.addEventListener('blur', () => validate(n));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = Object.keys(fields).every(validate);
      const done = document.getElementById('formOk');
      if (!ok) {
        const first = form.querySelector('.field.invalid input,.field.invalid select,.field.invalid textarea');
        if (first) first.focus();
        return;
      }
      const assunto = form.elements.assunto.value;
      const nome = form.elements.nome.value;
      if (done) {
        done.hidden = false;
        done.innerHTML = `✅ <strong>Obrigado, ${nome.split(' ')[0]}!</strong> Recebemos seu contato sobre <strong>${assunto}</strong>. Retornamos em até 1 dia útil pelo e-mail/WhatsApp. Para urgência: <a href="https://wa.me/5569984062398">chame no WhatsApp (69) 98406-2398</a>.`;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  }
})();
