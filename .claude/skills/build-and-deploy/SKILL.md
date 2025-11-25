---
name: build-and-deploy
description: Build and deploy this Next.js LangChain retrieval agent application with Supabase vector store. Use when building, deploying, setting up database, or preparing the project for production. Triggers on requests to build, deploy, setup vector store, or publish.
---

# Build and Deploy LangChain Retrieval Agent

## Overview

Build and deploy the LangChain.js retrieval agent application. This Next.js project provides an AI-powered agent that can query a vector store to answer questions, combining the power of LangGraph agents with retrieval-augmented generation (RAG).

## Environment Variables

All required environment variables are pre-configured in CCVM and available directly:
- `OPENAI_API_KEY` - OpenAI API key for LLM and embeddings
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_PRIVATE_KEY` - Supabase service role key
- `VERCEL_TOKEN` - For Vercel CLI authentication
- `NETLIFY_AUTH_TOKEN` - For Netlify CLI authentication

## Workflow

### 1. Setup Environment Variables

```bash
cp .env.example .env
```

Then populate `.env` with values from environment:

Example:
```bash
cat > .env << EOF
OPENAI_API_KEY="${OPENAI_API_KEY}"
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_PRIVATE_KEY="${SUPABASE_PRIVATE_KEY}"
EOF
```

### 2. Setup Supabase Vector Store

Run this SQL in your Supabase SQL editor to create the required table and function:

```sql
-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table
create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Create the matching function
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

### 3. Install Dependencies

```bash
yarn install
```

### 4. Build

```bash
yarn build
```

### 5. Deploy

**Vercel:**
```bash
vercel deploy --prod --yes
```

**Netlify:**
```bash
# First deployment
netlify deploy --prod --create-site

# Subsequent deployments
netlify deploy --prod
```

## Critical Notes

- **Supabase Required:** Must setup Supabase project with pgvector extension
- **Vector Store Setup:** Run SQL migration before using the app
- **API Keys Required:** Requires OpenAI API key for embeddings and LLM
- **No Dev Server:** Never run `yarn dev` in VM environment

## Features

- LangGraph agent with retriever tool
- Document ingestion with text splitting
- Vector embeddings with OpenAI
- Retrieval-augmented generation (RAG)
- Agent memory for conversational context
- Intermediate steps visualization
- Streaming responses with Vercel AI SDK
