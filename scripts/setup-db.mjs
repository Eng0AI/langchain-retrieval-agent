#!/usr/bin/env node

/**
 * Setup script for Supabase vector store
 * Creates the pgvector extension, documents table, and match_documents function
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { Client } = pg;

// Load .env file manually
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    // .env file not found
  }
}

loadEnv();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error('Error: SUPABASE_DB_URL is required in .env');
  console.error('Find it in: Supabase Dashboard → Settings → Database → Connection string → URI');
  process.exit(1);
}

const setupSQL = `
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536)
);

-- Create or replace the matching function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_count INT DEFAULT NULL,
  filter JSONB DEFAULT '{}'
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`;

async function setup() {
  console.log('Setting up Supabase vector store...\n');

  const client = new Client({ connectionString: SUPABASE_DB_URL });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!\n');

    console.log('Creating pgvector extension and documents table...');
    await client.query(setupSQL);

    console.log('\n✓ Vector store setup complete!');
    console.log('\nCreated:');
    console.log('  - pgvector extension');
    console.log('  - documents table');
    console.log('  - match_documents function');
    console.log('\nYou can now run: yarn build');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
