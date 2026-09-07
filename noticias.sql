-- ============================================================
-- SCTV • Tabela NOTICIAS + Storage de capas
-- Rode UMA VEZ no SQL Editor do Supabase (projeto pqmurfhshztlrztqjqpk)
-- Pré-requisito: tabela public.profiles (admin/correspondente) já criada
-- ============================================================

-- 1. Tabela de matérias
CREATE TABLE IF NOT EXISTS public.noticias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  linha_fina TEXT,
  capa_url TEXT,
  capa_credito TEXT,
  corpo TEXT NOT NULL,
  tags TEXT,
  news_keywords TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicada')),
  autor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  autor_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_noticias_slug ON public.noticias (slug);
CREATE INDEX IF NOT EXISTS idx_noticias_cat_status ON public.noticias (categoria, status, created_at DESC);

-- updated_at automático
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_noticias_updated ON public.noticias;
CREATE TRIGGER trg_noticias_updated
  BEFORE UPDATE ON public.noticias
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. RLS
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica" ON public.noticias;
CREATE POLICY "Leitura publica" ON public.noticias
  FOR SELECT USING (status = 'publicada');

DROP POLICY IF EXISTS "Aprovados publicam" ON public.noticias;
CREATE POLICY "Aprovados publicam" ON public.noticias
  FOR INSERT WITH CHECK (
    auth.uid() = autor_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

DROP POLICY IF EXISTS "Admin gerencia noticias" ON public.noticias;
CREATE POLICY "Admin gerencia noticias" ON public.noticias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'aprovado')
  );

-- 3. Storage público para capas (bucket "capas")
INSERT INTO storage.buckets (id, name, public)
VALUES ('capas', 'capas', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Capas publicas leitura" ON storage.objects;
CREATE POLICY "Capas publicas leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'capas');

DROP POLICY IF EXISTS "Aprovados sobem capas" ON storage.objects;
CREATE POLICY "Aprovados sobem capas" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'capas'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );
