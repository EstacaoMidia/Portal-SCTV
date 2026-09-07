/* SCTV ETAPA 5 — formulário do titular LGPD (protocolo + validação) */
(function () {
  'use strict';

  // Webhook do DPO (notificação em tempo real — configure 1x e esqueça):
  // Crie um webhook gratuito em Make/Zapier/n8n ou use FormSubmit e cole abaixo.
  // Ex: 'https://formsubmit.co/ajax/sctvofc@gmail.com' ou 'https://hook.make.com/xxxx'
  // Deixe '' para operar em modo local (protocolo + WhatsApp) sem dependências.
  const LGPD_WEBHOOK = '';
  const form = document.getElementById('lgpdForm');
  if (!form) return;
  const ok = document.getElementById('lgpdOk');

  function setErr(name, msg) {
    const input = form.elements[name];
    const wrap = input.closest('.field');
    const err = wrap.querySelector('.err');
    const bad = msg !== '';
    wrap.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', String(bad));
    if (err) err.textContent = msg;
    return !bad;
  }
  ['nome', 'email', 'tipo', 'msg'].forEach((n) => {
    const el = form.elements[n];
    if (el) el.addEventListener('blur', () => validateOne(n));
  });
  function validateOne(n) {
    const v = (form.elements[n].value || '').trim();
    if (n === 'nome') return setErr(n, v.length >= 3 ? '' : 'Informe seu nome completo.');
    if (n === 'email') return setErr(n, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'E-mail inválido.');
    if (n === 'tipo') return setErr(n, v !== '' ? '' : 'Escolha o tipo de pedido.');
    if (n === 'msg') return setErr(n, v.length >= 20 ? '' : 'Descreva seu pedido (mín. 20 caracteres).');
    return true;
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = ['nome', 'email', 'tipo', 'msg'].every(validateOne);
    if (!valid) {
      const first = form.querySelector('.field.invalid input,.field.invalid select,.field.invalid textarea');
      if (first) first.focus();
      return;
    }
    const proto = 'SCTV-LGPD-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const tipo = form.elements.tipo.value;
    const nome = form.elements.nome.value.split(' ')[0];
    const email = form.elements.email.value;
    const detalhe = form.elements.msg.value;
    // 1) Notificação em tempo real ao DPO (se webhook configurado — não bloqueia)
    if (LGPD_WEBHOOK) {
      try {
        fetch(LGPD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ protocolo: proto, nome, email, tipo, detalhe, origem: location.href, data: new Date().toISOString() })
        }).catch(() => {});
      } catch (err) {}
    }
    // Salva localmente o protocolo (prova + acompanhamento)
    try {
      const log = JSON.parse(localStorage.getItem('sctv_lgpd') || '[]');
      log.unshift({ proto, tipo, data: new Date().toISOString() });
      localStorage.setItem('sctv_lgpd', JSON.stringify(log.slice(0, 10)));
    } catch (err) {}
    if (ok) {
      ok.hidden = false;
      ok.innerHTML = `✅ <strong>Obrigado, ${nome}!</strong> Pedido de <strong>${tipo}</strong> registrado sob protocolo <strong>${proto}</strong>. Respondemos em <strong>até 15 dias corridos</strong> (padrão ANPD) pelo seu e-mail. Urgente? <a href="https://wa.me/5569984062398?text=${encodeURIComponent('Protocolo ' + proto + ' — preciso falar sobre meus dados')}">chame no WhatsApp (69) 98406-2398</a>.`;
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    form.reset();
  });
})();
