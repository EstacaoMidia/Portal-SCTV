-- ============================================================
-- SCTV • Tabela BANNERS (Gerenciador de Publicidade)
-- Rode UMA VEZ no SQL Editor do Supabase
-- Espaços: topo_principal | lateral_topo | entre_materias | rodape
-- ============================================================

-- 0. Correção anti-recursão em profiles (idempotente — pode rodar de novo)
DROP POLICY IF EXISTS "Permitir leitura pública ou própria dos perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admin gerencia todos" ON public.profiles;
DROP POLICY IF EXISTS "Ler proprio perfil" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'aprovado'
  );
$$;

CREATE POLICY "Ler proprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin gerencia todos" ON public.profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;

-- 1. Tabela de banners (1 linha por posição = upsert por posicao)
CREATE TABLE IF NOT EXISTS public.banners (
  posicao TEXT PRIMARY KEY CHECK (posicao IN ('topo_principal', 'lateral_topo', 'entre_materias', 'rodape')),
  tipo TEXT NOT NULL DEFAULT 'manual' CHECK (tipo IN ('manual', 'adsense', 'desativado')),
  imagem_url TEXT,
  link_destino TEXT,
  script_adsense TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.touch_banners_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_banners_updated ON public.banners;
CREATE TRIGGER trg_banners_updated
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.touch_banners_updated();

-- 2. RLS: público lê só ativos; admin escreve tudo
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banners publicos" ON public.banners;
CREATE POLICY "Banners publicos" ON public.banners
  FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "Admin gerencia banners" ON public.banners;
CREATE POLICY "Admin gerencia banners" ON public.banners
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;

-- 3. Storage para peças (bucket "banners", público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Banners publicos leitura" ON storage.objects;
CREATE POLICY "Banners publicos leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Aprovados sobem banners" ON storage.objects;
CREATE POLICY "Aprovados sobem banners" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );
