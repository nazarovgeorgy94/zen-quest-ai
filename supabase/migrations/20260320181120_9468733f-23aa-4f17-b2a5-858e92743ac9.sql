
-- Lower trigram threshold and add ILIKE fallback
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
      ts_rank(kc.fts, plainto_tsquery('russian', query_text)) * 10,
      CASE WHEN kc.search_text ILIKE '%' || query_text || '%' THEN 0.5 ELSE 0 END
    )::FLOAT AS similarity
  FROM public.knowledge_chunks kc
  WHERE 
    extensions.similarity(kc.search_text, query_text) > 0.05
    OR kc.fts @@ plainto_tsquery('russian', query_text)
    OR kc.search_text ILIKE '%' || query_text || '%'
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
