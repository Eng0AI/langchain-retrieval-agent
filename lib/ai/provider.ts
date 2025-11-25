/**
 * LLM Provider Configuration for LangChain
 *
 * All LLM configuration is read from environment variables - NO hardcoded defaults.
 *
 * Required environment variables:
 * - LLM_PROVIDER: "openai" | "anthropic" | "google"
 * - LLM_MODEL: Model ID (e.g., "gpt-4o", "claude-sonnet-4-5-20250514", "gemini-2.5-flash")
 * - OPENAI_API_KEY: Always required for embeddings (OpenAI embeddings used for all providers)
 *
 * API key environment variables per provider:
 * - OpenAI: OPENAI_API_KEY (also used for embeddings)
 * - Anthropic: ANTHROPIC_API_KEY + OPENAI_API_KEY (for embeddings)
 * - Google: GOOGLE_API_KEY + OPENAI_API_KEY (for embeddings)
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type LLMProviderType = "openai" | "anthropic" | "google";

/**
 * Get the configured LLM provider from environment variables
 */
export function getLLMProvider(): LLMProviderType {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();

  if (
    provider === "anthropic" ||
    provider === "google" ||
    provider === "openai"
  ) {
    return provider;
  }

  throw new Error(
    "LLM_PROVIDER environment variable is required. Set to 'openai', 'anthropic', or 'google'."
  );
}

/**
 * Get the configured model ID from environment variables
 */
export function getLLMModel(): string {
  const model = process.env.LLM_MODEL;

  if (!model) {
    throw new Error(
      "LLM_MODEL environment variable is required. Example: 'gpt-4o', 'claude-sonnet-4-5-20250514', 'gemini-2.5-flash'"
    );
  }

  return model;
}

/**
 * Get the LangChain chat model instance based on environment configuration
 */
export function getChatModel(options?: { temperature?: number }): BaseChatModel {
  const provider = getLLMProvider();
  const modelId = getLLMModel();
  const temperature = options?.temperature ?? 0;

  switch (provider) {
    case "anthropic":
      return new ChatAnthropic({
        model: modelId,
        temperature,
      });
    case "google":
      return new ChatGoogleGenerativeAI({
        model: modelId,
        temperature,
      });
    case "openai":
    default:
      return new ChatOpenAI({
        model: modelId,
        temperature,
      });
  }
}

/**
 * Get the embeddings model - always uses OpenAI embeddings
 * Requires OPENAI_API_KEY to be set regardless of chat model provider
 */
export function getEmbeddings() {
  return new OpenAIEmbeddings();
}
