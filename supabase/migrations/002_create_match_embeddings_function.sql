-- Migration: 002_create_match_embeddings_function
-- Description: Create RPC function for pgvector cosine similarity search
-- Created: 2026-01-30

-- Drop function if exists to allow re-running migration
drop function if exists match_article_embeddings(vector, float, int);

-- Create RPC function for vector similarity search using cosine similarity
create or replace function match_article_embeddings(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
returns table (
    id uuid,
    article_id uuid,
    similarity float,
    title text,
    author text,
    published_date date,
    summary text,
    url text,
    keywords text[],
    category_name text,
    media_source text
)
language plpgsql
as $$
begin
  return query
  select
    ae.id,
    ae.article_id,
    1 - (ae.embedding <=> query_embedding) as similarity,
    a.title,
    a.author,
    a.published_date,
    a.summary,
    a.url,
    a.keywords,
    c.name,
    o.name
  from article_embeddings ae
  inner join articles a on ae.article_id = a.id
  left join categories c on a.category_id = c.id
  left join organizations o on a.organization_id = o.id
  where 1 - (ae.embedding <=> query_embedding) > match_threshold
  order by ae.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Add comment for documentation
comment on function match_article_embeddings is 'Find articles by semantic similarity using pgvector cosine distance';
