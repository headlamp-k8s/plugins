# MCP Tool Routing

When many MCP servers expose dozens of tools, sending every tool schema to
the LLM wastes context window and slows responses. MCP tool routing selects
only the relevant tools per query — analogous to the
[skills router](../skills/skills-router.md).

## Architecture

```
User query
    ├── MCPEmbeddingRouter (semantic, if configured)
    │       ↓ fallback on any failure
    └── MCPToolRouter (keyword-based)
            ↓
    Filtered tool list → bound to LLM
```

## Routers

### Keyword (`MCPToolRouter`)

Tokenises query and tool metadata (name, server name, description, schema
property names), computes TF-based overlap. Same algorithm as the skills
`SkillRouter`. Routing is skipped when tool count ≤ `maxTools`.

### Embedding (`MCPEmbeddingRouter`)

Uses any LangChain [`Embeddings`](https://js.langchain.com/docs/concepts/embedding_models/)
provider. Embeds tool metadata at discovery time, embeds the query at request
time, ranks by cosine similarity. Falls back to keyword routing on any
failure (rate limit, network, missing model).

| Decision | Rationale |
|----------|-----------|
| Embed metadata, not full schemas | Schemas can be large; routing signal is name + description |
| Embed at discovery time | Metadata rarely changes; only the short query is embedded per request |
| Automatic keyword fallback | Embedding failures never block the LLM call |

## Configuration

```typescript
interface MCPToolRouterConfig {
  maxTools: number;   // default 10
  minScore: number;   // default 0.1
}
```

## Integration

```typescript
import { routeMCPTools } from '@headlamp-k8s/ai-common/mcp/MCPToolRouter';

const allMCPTools = toolManager.getMCPTools();
const toolInfos = allMCPTools.map(t => ({
  name: t.name, description: t.description, serverName: t.name.split('__')[0],
}));
const relevant = routeMCPTools(userQuery, toolInfos, { maxTools: 8, minScore: 0.1 });
```

## Comparison with skills routing

| Aspect | Skills router | MCP tool router |
|--------|--------------|----------------|
| Input | Parsed markdown files | MCP tool schemas |
| Output | Prompt text for system message | Filtered tool list bound to model |
| Embedding router | `EmbeddingRouter` | `MCPEmbeddingRouter` |
| Keyword router | `routeSkills()` | `routeMCPTools()` |

## Tests

```bash
packages/ai-common
npx vitest run src/mcp/MCPToolRouter.test.ts src/mcp/MCPEmbeddingRouter.test.ts
```

## References

- [LangChain Embeddings](https://js.langchain.com/docs/concepts/embedding_models/)
- [Skills Router](../skills/skills-router.md)
