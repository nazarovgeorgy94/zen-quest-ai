
-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Drop the vector-dependent function and index
DROP FUNCTION IF EXISTS public.match_knowledge_chunks(vector, float, int);
DROP INDEX IF EXISTS idx_knowledge_chunks_embedding;

-- Remove embedding column (not needed without embedding model)
ALTER TABLE public.knowledge_chunks DROP COLUMN IF EXISTS embedding;

-- Add full-text search column
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS search_text TEXT GENERATED ALWAYS AS (
  slug || ' ' || title || ' ' || content
) STORED;

-- GIN index for trigram similarity
CREATE INDEX idx_knowledge_chunks_search_trgm 
  ON public.knowledge_chunks USING gin (search_text extensions.gin_trgm_ops);

-- Full-text search index
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(content, ''))) STORED;
CREATE INDEX idx_knowledge_chunks_fts ON public.knowledge_chunks USING gin (fts);

-- Search function using combined trigram + full-text scoring
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  query_text TEXT,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  source_type TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT
    kc.id,
    kc.slug,
    kc.title,
    kc.content,
    kc.source_type,
    kc.metadata,
    GREATEST(
      extensions.similarity(kc.search_text, query_text),
      ts_rank(kc.fts, plainto_tsquery('russian', query_text))
    )::FLOAT AS similarity
  FROM public.knowledge_chunks kc
  WHERE 
    kc.search_text % query_text
    OR kc.fts @@ plainto_tsquery('russian', query_text)
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
