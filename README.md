# Retrieval Agent

AI agent with retrieval tool for document Q&A, powered by LangGraph and Supabase vector store.

## Tech Stack

- Next.js 15
- LangChain.js + LangGraph
- Vercel AI SDK
- Supabase Vector Store (pgvector)
- Multi-provider LLM support (OpenAI, Anthropic, Google)

## Getting Started

1. Copy `.env.example` to `.env.local`
2. Set up Supabase project and run `yarn setup` to initialize vector store
3. Set your LLM provider and API keys
4. Run `yarn install && yarn dev`

## Environment Variables

```bash
# LLM Provider
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1
OPENAI_API_KEY=sk-...        # Always required for embeddings

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PRIVATE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://...  # For setup script
```

## License

MIT
