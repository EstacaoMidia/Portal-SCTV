-- ============================================================
-- SCTV • Migração v2 da tabela NOTICIAS (editor premium)
-- Rode DEPOIS do noticias.sql, uma vez, no SQL Editor do Supabase
-- ============================================================

-- 1. Novas colunas do editor premium
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS video_youtube TEXT;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS galeria TEXT;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS cta_tipo TEXT NOT NULL DEFAULT 'nenhum'
  CHECK (cta_tipo IN ('nenhum', 'vip', 'youtube', 'inscricao'));
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS keyword_foco TEXT;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS og_image TEXT;

-- 2. Novo status: "pendente" (fluxo correspondente → admin)
ALTER TABLE public.noticias DROP CONSTRAINT IF EXISTS noticias_status_check;
ALTER TABLE public.noticias ADD CONSTRAINT noticias_status_check
  CHECK (status IN ('rascunho', 'pendente', 'publicada'));

-- 3. Autores leem e editam os PRÓPRIOS rascunhos/pendentes
DROP POLICY IF EXISTS "Autores leem proprios" ON public.noticias;
CREATE POLICY "Autores leem proprios" ON public.noticias
  FOR SELECT USING (auth.uid() = autor_id);

DROP POLICY IF EXISTS "Autores editam rascunhos" ON public.noticias;
CREATE POLICY "Autores editam rascunhos" ON public.noticias
  FOR UPDATE USING (
    auth.uid() = autor_id AND status IN ('rascunho', 'pendente')
  ) WITH CHECK (
    auth.uid() = autor_id AND status IN ('rascunho', 'pendente', 'publicada')
  );
