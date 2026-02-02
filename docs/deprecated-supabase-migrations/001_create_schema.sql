-- Migration: 001_create_schema
-- Description: Create initial database schema for MCPress
-- Created: 2024-01-30
-- DEPRECATED: Storage is now Chroma; this file is archived for reference only.

-- Enable pgvector extension for vector storage
-- Note: This requires pgvector extension to be installed on Supabase
create extension if not exists vector;

-- Create enum for categories (optional - can also use text with CHECK constraint)
create type category_type as enum (
    'news',
    'tech',
    'sports',
    'business',
    'politics',
    'entertainment',
    'health',
    'science'
);

-- Organizations table
-- Stores news organizations/journalists
create table organizations (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    email text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
-- Stores article categories
create table categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default categories
insert into categories (name) values 
    ('news'),
    ('tech'),
    ('sports'),
    ('business'),
    ('politics'),
    ('entertainment'),
    ('health'),
    ('science')
on conflict (name) do nothing;

-- Articles table
-- Stores article content and metadata
create table articles (
    id uuid default gen_random_uuid() primary key,
    url text not null unique,
    title text not null,
    author text,
    published_date date,
    content text not null,
    summary text not null,
    keywords text[] default '{}',
    category_id uuid references categories(id),
    organization_id uuid references organizations(id),
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Article embeddings table
-- Stores vector embeddings of article summaries for semantic search
-- Using pgvector with 1536 dimensions (text-embedding-3-small)
create table article_embeddings (
    id uuid default gen_random_uuid() primary key,
    article_id uuid references articles(id) on delete cascade not null unique,
    embedding vector(1536) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_articles_category on articles(category_id);
create index idx_articles_organization on articles(organization_id);
create index idx_articles_url on articles(url);
create index idx_articles_created_at on articles(created_at desc);
create index idx_articles_published_date on articles(published_date desc);

-- Create index on embeddings for cosine similarity search
-- Using IVFFlat index for efficient approximate nearest neighbor search
create index idx_embeddings_cosine on article_embeddings 
using ivfflat (embedding vector_cosine_ops);

-- Create composite index for full-text search on articles
create index idx_articles_title_summary on articles using gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
);

-- Add comments for documentation
comment on table organizations is 'News organizations that submit articles';
comment on table categories is 'Article categories for classification';
comment on table articles is 'Main article storage with content and metadata';
comment on table article_embeddings is 'Vector embeddings for semantic search';

comment on column organizations.name is 'Organization name';
comment on column organizations.email is 'Organization contact email';
comment on column articles.keywords is 'Array of keywords extracted from article';
comment on column article_embeddings.embedding is 'OpenAI text-embedding-3-small vector (1536 dimensions)';
