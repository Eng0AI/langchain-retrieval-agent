#!/usr/bin/env node

/**
 * Setup script for Supabase vector store
 * Creates the pgvector extension, documents table, and match_documents function
 *
 * Usage: node scripts/setup-db.mjs
 * Requires: SUPABASE_URL and SUPABASE_PRIVATE_KEY in .env or environment
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually (no dotenv dependency needed)
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
    // .env file not found, rely on environment variables
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY;

if (!SUPABASE_URL || !SUPABASE_PRIVATE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_PRIVATE_KEY are required');
  console.error('Set them in .env file or as environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PRIVATE_KEY);

const setupSQL = `
-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table
create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Create index for faster similarity search
create index if not exists documents_embedding_idx on documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
`;

const matchFunctionSQL = `
-- Create or replace the matching function
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
`;

async function setup() {
  console.log('Setting up Supabase vector store...\n');

  // Run setup SQL
  console.log('1. Creating pgvector extension and documents table...');
  const { error: setupError } = await supabase.rpc('exec_sql', { sql: setupSQL }).maybeSingle();

  // If rpc doesn't exist, try direct SQL via REST
  if (setupError) {
    // Use Supabase SQL editor API (requires service role key)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_PRIVATE_KEY,
        'Authorization': `Bearer ${SUPABASE_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: setupSQL }),
    });

    if (!response.ok) {
      // Fall back to running SQL statements via postgres connection info
      console.log('   Note: Direct SQL execution not available via REST API.');
      console.log('   Please run the following SQL manually in Supabase SQL Editor:\n');
      console.log('--- Copy from here ---');
      console.log(setupSQL);
      console.log(matchFunctionSQL);
      console.log('--- End copy ---\n');
      console.log('After running the SQL, your vector store will be ready.');
      process.exit(0);
    }
  }

  console.log('   Done!\n');

  // Run match function SQL
  console.log('2. Creating match_documents function...');
  const { error: funcError } = await supabase.rpc('exec_sql', { sql: matchFunctionSQL }).maybeSingle();

  if (funcError) {
    console.log('   Note: Function creation via API may require manual setup.');
  } else {
    console.log('   Done!\n');
  }

  console.log('Vector store setup complete!');
  console.log('You can now run: yarn dev');
}

// Alternative: Just print the SQL for manual execution
async function printSQL() {
  console.log('='.repeat(60));
  console.log('Supabase Vector Store Setup SQL');
  console.log('='.repeat(60));
  console.log('\nRun this SQL in your Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/_/sql\n');
  console.log(setupSQL);
  console.log(matchFunctionSQL);
  console.log('='.repeat(60));
}

// Check if we can execute SQL directly or need to print instructions
async function main() {
  try {
    // Test connection
    const { error } = await supabase.from('documents').select('id').limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist - print SQL for manual setup
      console.log('Documents table not found. Running setup...\n');
      await printSQL();
    } else if (error) {
      console.log('Connection test failed:', error.message);
      console.log('\nPrinting SQL for manual setup:\n');
      await printSQL();
    } else {
      console.log('✓ Vector store already set up! Documents table exists.');
      console.log('  You can run: yarn dev');
    }
  } catch (e) {
    console.error('Error:', e.message);
    await printSQL();
  }
}

main();
