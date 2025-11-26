---
name: build-and-deploy
description: Build and deploy this Next.js LangChain retrieval agent application with Supabase vector store. Use when building, deploying, setting up vector store, or preparing the project for production.
---

# Build and Deploy LangChain Retrieval Agent

## Overview

Build and deploy the LangChain.js retrieval agent application. This Next.js project provides an AI agent with retrieval tool for document Q&A using RAG, powered by LangGraph and Supabase vector store.

## Workflow

### 1. Setup Environment Variables

**Read `.env.example` to see all required variables:**

```bash
cat .env.example
```

**Create `.env` by reading values from current environment:**

For each variable in `.env.example`, read the value from the current environment and write to `.env`. Example approach:

```bash
# Read .env.example and create .env with values from current environment
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  # Extract variable name (before = sign)
  var_name=$(echo "$line" | cut -d'=' -f1)
  # Get value from environment
  var_value="${!var_name}"
  # Write to .env
  echo "${var_name}=${var_value}" >> .env
done < .env.example
```

Or manually inspect `.env.example` and create `.env` with the required values from environment variables.

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
# Set platform env vars (first time only, use printf NOT echo to avoid newline issues)
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  printf "%s" "$value" | vercel env add "$key" production
done < .env

# Build locally for production
vercel build --prod

# Deploy prebuilt (bypasses Git author permission issues)
vercel deploy --prebuilt --prod --yes
```

**Netlify:**
```bash
# Set platform env vars (first time only)
netlify env:import .env

# Deploy
netlify deploy --prod
```

## Critical Notes

- **Supabase Required:** Must setup Supabase project with pgvector extension
- **Vector Store Setup:** Run SQL migration before using the app
- **Environment Variables:** All values come from current environment - inspect `.env.example` for required variables
- **OpenAI for Embeddings:** OPENAI_API_KEY is always required for vector embeddings
- **No Dev Server:** Never run `yarn dev` in VM environment

## Features

- AI agent with retrieval tool via LangGraph
- Document ingestion with text splitting
- Vector embeddings with OpenAI
- Retrieval-augmented generation (RAG)
- Streaming responses with Vercel AI SDK
