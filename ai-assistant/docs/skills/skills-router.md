# Skills Router

The skills router selects the most relevant skills for each user query, preventing the LLM context window from being filled with irrelevant content. This document covers the two routing strategies (keyword and embedding), how they integrate into the LLM pipeline, and how to configure them.

## Why route skills?

When many skills are loaded (>5), injecting all of them into every system prompt wastes context tokens and can degrade response quality. The router scores each skill against the user's query and selects only the top matches, respecting both count and byte-size budgets.

## Routing strategies

### Keyword router (`SkillRouter`)

The default strategy. Uses lightweight TF-based keyword matching on skill metadata (name, description, tags).

**How it works:**

1. Tokenizes the user query into lowercase words, removing stop words.
2. Tokenizes each skill's metadata (`name + description + tags`).
3. Scores each skill by counting query token matches in the skill's token set, normalized to 0–1.
4. Includes partial-match scoring for compound terms (e.g., "ratelimit" matches "rate").
5. Selects the top skills by score, respecting `maxSkills` count and `maxTotalBytes` budget.

**Pros:** Zero latency, no external API calls, no additional cost.
**Cons:** Misses semantic similarity (e.g., "pod networking issues" won't match a skill tagged "CNI troubleshooting" unless the words overlap).

**Source:** [`ai-common/src/skills/SkillRouter.ts`](../../packages/ai-common/src/skills/SkillRouter.ts)

### Embedding router (`EmbeddingRouter`)

Uses cosine similarity over embedding vectors for semantic skill selection. This is the recommended strategy when an embedding model is available.

**How it works:**

1. **Index phase (once at load time):** Embeds each skill's metadata text (`name + description + tags`) via the configured LangChain `Embeddings` provider. Vectors are stored in memory.
2. **Query phase (per request):** Embeds the user's query and computes cosine similarity against all indexed skill vectors.
3. **Selection:** Ranks skills by similarity score, applies `minScore` threshold, and selects the top results within `maxSkills` and `maxTotalBytes` budgets.

**Design decisions:**

- **Embed metadata, not full content.** Skill bodies can be multi-KB of Markdown. Embedding the full content adds noise and makes the vectors less useful for routing. The name, description, and tags are the routing signal — this follows the pattern recommended in LangChain's [tool selection documentation](https://python.langchain.com/docs/how_to/custom_tools/).
- **Embed once, query per request.** Skill descriptions change rarely (hourly cache TTL). We avoid re-embedding all skills on every query by computing vectors at load time and only embedding the short query string at runtime.
- **Provider-agnostic.** The router accepts any LangChain [`Embeddings`](https://js.langchain.com/docs/concepts/embedding_models/) instance — OpenAI, Ollama, Azure, Cohere, etc. The caller configures the provider; the router just calls `embedDocuments()` and `embedQuery()`.
- **Automatic fallback.** If embedding fails (model unavailable, rate-limited, network error), the router falls back to keyword-based routing. Skill routing errors never block the main LLM call.

**Source:** [`ai-common/src/skills/EmbeddingRouter.ts`](../../packages/ai-common/src/skills/EmbeddingRouter.ts)

## Router configuration

Both routers use the same `SkillRouterConfig` interface:

```typescript
interface SkillRouterConfig {
  /** Maximum number of skills to include in the prompt (default: 5). */
  maxSkills: number;
  /** Minimum relevance score 0–1 for a skill to be included (default: 0.1). */
  minScore: number;
  /** Maximum total content size in bytes for routed skills (default: 100KB). */
  maxTotalBytes: number;
}
```

When the total number of enabled skills is ≤ `maxSkills`, all skills are included without routing — there's no benefit to filtering a small set.

## LLM pipeline integration

The routing is wired into the LangChain pipeline through `SkillManager` and `LangChainManager`:

```
User message
    │
    ▼
LangChainManager.userSend() / userSendStream()
    │
    ├── getSkillsPromptForQuery(message)
    │       │
    │       ├── SkillManager.loadAllSkills()  ← cached, refreshed hourly
    │       │
    │       └── SkillManager.getRoutedSkillsPromptText(query, config)
    │               │
    │               ├── EmbeddingRouter.routeAndFormat()  ← if configured
    │               │       │
    │               │       └── fallback → keyword routeAndFormatSkills()
    │               │
    │               └── keyword routeAndFormatSkills()    ← default
    │
    ├── createSystemPrompt()  ← includes routed skills text
    │
    └── LLM call with system prompt + chat history + user message
```

The `LangChainManager` stores the routed skills text in a transient `currentSkillsPromptText` field per request. This avoids threading the skills text through every internal method (`handleDirectToolCallingRequest`, `handleLocalModelRequest`, etc.).

### Setup code

```typescript
import { SkillManager } from '@headlamp-k8s/ai-common/skills/SkillManager';
import { EmbeddingRouter } from '@headlamp-k8s/ai-common/skills/EmbeddingRouter';
import { OpenAIEmbeddings } from '@langchain/openai';

// 1. Create the skill manager
const skillManager = new SkillManager(fs, httpClient, zipExtractor);

// 2. Load skills
const skills = await skillManager.loadAllSkills(skillsConfig);

// 3. (Optional) Set up embedding-based routing
const embeddings = new OpenAIEmbeddings({
  apiKey: 'sk-...',
  model: 'text-embedding-3-small',
});
const embeddingRouter = new EmbeddingRouter(embeddings);
await embeddingRouter.indexSkills(skills);
skillManager.setEmbeddingRouter(embeddingRouter);

// 4. Wire into the LLM pipeline
langChainManager.setSkillManager(skillManager, skillsConfig);

// Skills are now automatically routed per-query in userSend/userSendStream.
// No further action needed — the system prompt includes relevant skills.
```

### Without embedding (keyword-only)

Skip steps 3 and the `setEmbeddingRouter` call. The `SkillManager` uses keyword routing by default.

### Switching providers

Pass any LangChain `Embeddings` instance to the `EmbeddingRouter`:

```typescript
// Ollama (local)
import { OllamaEmbeddings } from '@langchain/ollama';
const embeddings = new OllamaEmbeddings({ model: 'nomic-embed-text' });

// Azure OpenAI
import { AzureOpenAIEmbeddings } from '@langchain/openai';
const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiDeploymentName: 'text-embedding-3-small',
});
```

## Cosine similarity

The `cosineSimilarity()` function computes the similarity between two vectors:

```
similarity = (a · b) / (‖a‖ × ‖b‖)
```

For normalized embedding vectors (as produced by most providers), results are in [0, 1] where 1 means identical meaning and 0 means unrelated. The `minScore` threshold (default 0.1) filters out low-relevance matches.

## Cache invalidation

- Skills are cached for 1 hour (configurable via `cacheTtlMs`).
- Changing skill sources in the config automatically invalidates the cache.
- Calling `skillManager.invalidateCache()` clears both the skill cache and the embedding index, forcing a full reload and re-indexing on the next query.

## Debugging skill relevance

Both routers expose scoring methods for debugging:

```typescript
// Keyword router
import { scoreSkills } from '@headlamp-k8s/ai-common/skills/SkillRouter';
const scores = scoreSkills('install kubeshark', enabledSkills);
// → [{ skill: { metadata: { name: 'kubeshark' } }, score: 0.85 }, ...]

// Embedding router
const scores = await embeddingRouter.scoreSkills('install kubeshark');
// → [{ skill: { metadata: { name: 'kubeshark' } }, score: 0.92 }, ...]
```

## References

### LangChain documentation

- [Embedding models concept guide](https://js.langchain.com/docs/concepts/embedding_models/) — explains how LangChain abstracts embedding providers and the `Embeddings` base class used by `EmbeddingRouter`.
- [How to create custom tools](https://python.langchain.com/docs/how_to/custom_tools/) — covers tool/skill description best practices; the principle of embedding descriptions (not full content) for routing comes from this pattern.
- [Text embedding models (JS)](https://js.langchain.com/docs/integrations/text_embedding/) — integration guides for OpenAI, Ollama, Azure, Cohere, and other embedding providers supported by the `EmbeddingRouter`.
- [Semantic similarity with embeddings](https://platform.openai.com/docs/guides/embeddings) — OpenAI's guide on using embeddings for search and similarity, which is the foundation of the `EmbeddingRouter`'s cosine similarity approach.

### Internal documentation

- [Skills system proposal](./skills-proposal.md) — architecture decisions, industry survey, and security considerations for the skills system.
- [Skills STRIDE threat model](./skills-stride-threat-model.md) — security threat analysis for skill loading, routing, and prompt injection.

### Related projects

- [GitHub Copilot Skills](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) — `.github/skills/*/SKILL.md` format that Headlamp's skill parser supports.
- [agentskills.io](https://agentskills.io/) — cross-tool skill standard used by Copilot, Claude, Cursor, and others.
- [Flux agent-skills](https://github.com/fluxcd/agent-skills) — example of a community skill repository that Headlamp can load.
- [Azure Skills](https://github.com/microsoft/azure-skills) — Microsoft's curated Kubernetes/Azure skill repository.
