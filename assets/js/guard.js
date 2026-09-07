/* SCTV guard — proteção central das rotas /painel e /administrador.
   Checa sessão + perfil (role/status) no Supabase e, sem acesso,
   registra a intenção via History API e redireciona com location.replace
   (replace evita o loop do botão "voltar" para a página protegida). */
import { supabase } from './supabaseClient.js';

function redirectLogin() {
  try {
    history.pushState({ guarded: true, at: Date.now() }, '', '/login');
  } catch (e) { /* History API indisponível: segue para o replace */ }
  window.location.replace('/login');
  throw new Error('redirect-login');
}

export async function requireAuth(role = 'correspondente') {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) redirectLogin();

  const { data: me, error } = await supabase
    .from('profiles')
    .select('nome, email, role, status, created_at')
    .eq('id', sess.session.user.id)
    .single();

  if (error || !me || me.status !== 'aprovado') {
    await supabase.auth.signOut();
    redirectLogin();
  }
  if (role === 'admin' && me.role !== 'admin') {
    await supabase.auth.signOut();
    redirectLogin();
  }
  return me;
}
