import { describe, expect, it } from 'vitest';
import { basePrompt } from './baseAssistantPrompt';
import {
  buildMCPToolsSection,
  buildSystemPrompt,
  buildToolResponseSystemPrompt,
  NO_K8S_TOOLS_PROMPT,
  TOOL_RESPONSE_INSTRUCTIONS,
} from './buildSystemPrompt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const noTools = {
  availableTools: [],
  mcpTools: [],
  skillsText: '',
  currentContext: undefined,
};

const withK8s = {
  ...noTools,
  availableTools: ['kubernetes_api_request'],
};

// =============================================================================
// NO_K8S_TOOLS_PROMPT constant
// =============================================================================

describe('NO_K8S_TOOLS_PROMPT', () => {
  it('mentions that tools are DISABLED', () => {
    expect(NO_K8S_TOOLS_PROMPT).toContain('DISABLED');
  });

  it('lists what the assistant CAN do', () => {
    expect(NO_K8S_TOOLS_PROMPT).toContain('WHAT YOU CAN DO');
  });

  it('includes YAML formatting guidance', () => {
    expect(NO_K8S_TOOLS_PROMPT).toContain('YAML FORMATTING');
  });
});

// =============================================================================
// buildMCPToolsSection
// =============================================================================

describe('buildMCPToolsSection', () => {
  it('returns empty string when no MCP tools are provided', () => {
    expect(buildMCPToolsSection([])).toBe('');
  });

  it('lists each tool name and description', () => {
    const tools = [
      { name: 'get_time', description: 'Returns current time' },
      { name: 'search_web', description: 'Searches the web' },
    ];
    const section = buildMCPToolsSection(tools);
    expect(section).toContain('- get_time: Returns current time');
    expect(section).toContain('- search_web: Searches the web');
  });

  it('uses "No description" when description is absent', () => {
    const section = buildMCPToolsSection([{ name: 'mystery_tool' }]);
    expect(section).toContain('mystery_tool: No description');
  });

  it('includes the MCP TOOLS AVAILABLE heading', () => {
    expect(buildMCPToolsSection([{ name: 'x' }])).toContain('MCP TOOLS AVAILABLE');
  });

  it('includes tool usage guidance for parameter handling', () => {
    expect(buildMCPToolsSection([{ name: 'x' }])).toContain('PARAMETER HANDLING');
  });

  it('includes response formatting guidance', () => {
    expect(buildMCPToolsSection([{ name: 'x' }])).toContain('RESPONSE FORMATTING');
  });

  it('handles a single tool correctly', () => {
    const section = buildMCPToolsSection([{ name: 'only_tool', description: 'Does one thing' }]);
    expect(section).toContain('only_tool');
    expect(section).toContain('Does one thing');
  });
});

// =============================================================================
// buildSystemPrompt
// =============================================================================

describe('buildSystemPrompt', () => {
  // ── base content selection ─────────────────────────────────────────────────

  it('uses NO_K8S_TOOLS_PROMPT when kubernetes_api_request is not in availableTools', () => {
    const result = buildSystemPrompt(noTools);
    expect(result).toContain('DISABLED');
    expect(result).not.toBe(basePrompt);
  });

  it('uses basePrompt when kubernetes_api_request is available', () => {
    const result = buildSystemPrompt(withK8s);
    expect(result).toContain(basePrompt);
  });

  it('does NOT include the disabled-tools warning when k8s tool is enabled', () => {
    const result = buildSystemPrompt(withK8s);
    expect(result).not.toContain('DISABLED in your settings');
  });

  // ── MCP section ────────────────────────────────────────────────────────────

  it('omits the MCP section when mcpTools is empty', () => {
    const result = buildSystemPrompt(withK8s);
    expect(result).not.toContain('MCP TOOLS AVAILABLE');
  });

  it('includes MCP section when tools are provided', () => {
    const result = buildSystemPrompt({
      ...withK8s,
      mcpTools: [{ name: 'my_mcp_tool', description: 'A tool' }],
    });
    expect(result).toContain('MCP TOOLS AVAILABLE');
    expect(result).toContain('my_mcp_tool');
  });

  it('lists multiple MCP tools', () => {
    const result = buildSystemPrompt({
      ...withK8s,
      mcpTools: [
        { name: 'tool_a', description: 'First' },
        { name: 'tool_b', description: 'Second' },
      ],
    });
    expect(result).toContain('tool_a');
    expect(result).toContain('tool_b');
  });

  // ── skills injection ───────────────────────────────────────────────────────

  it('appends skillsText when non-empty', () => {
    const result = buildSystemPrompt({
      ...withK8s,
      skillsText: '\n\n## SKILL: debugging\nHelp debug Kubernetes issues.',
    });
    expect(result).toContain('SKILL: debugging');
  });

  it('does NOT append skillsText when it is empty', () => {
    const result = buildSystemPrompt({ ...withK8s, skillsText: '' });
    expect(result).not.toContain('SKILL:');
  });

  // ── current context ────────────────────────────────────────────────────────

  it('appends CURRENT CONTEXT block when provided', () => {
    const result = buildSystemPrompt({
      ...withK8s,
      currentContext: 'Cluster: prod-eu, Namespace: payments',
    });
    expect(result).toContain('CURRENT CONTEXT:');
    expect(result).toContain('Cluster: prod-eu');
  });

  it('does NOT append CURRENT CONTEXT when undefined', () => {
    const result = buildSystemPrompt({ ...withK8s, currentContext: undefined });
    expect(result).not.toContain('CURRENT CONTEXT');
  });

  it('does NOT append CURRENT CONTEXT when empty string', () => {
    // currentContext is typed as string | undefined; an empty string is falsy
    // and treated the same as undefined in the conditional.
    const result = buildSystemPrompt({ ...withK8s, currentContext: '' });
    expect(result).not.toContain('CURRENT CONTEXT');
  });

  // ── combined scenarios ─────────────────────────────────────────────────────

  it('combines all four sections correctly', () => {
    const result = buildSystemPrompt({
      availableTools: ['kubernetes_api_request'],
      mcpTools: [{ name: 'time_tool', description: 'Returns time' }],
      skillsText: '\nEXTRA SKILL INFO',
      currentContext: 'ns: default',
    });
    expect(result).toContain(basePrompt);
    expect(result).toContain('MCP TOOLS AVAILABLE');
    expect(result).toContain('time_tool');
    expect(result).toContain('EXTRA SKILL INFO');
    expect(result).toContain('CURRENT CONTEXT');
    expect(result).toContain('ns: default');
  });

  it('works with no k8s and MCP tools together', () => {
    const result = buildSystemPrompt({
      availableTools: [],
      mcpTools: [{ name: 'only_mcp' }],
      skillsText: '',
      currentContext: undefined,
    });
    expect(result).toContain('DISABLED');
    expect(result).toContain('only_mcp');
  });
});

// =============================================================================
// TOOL_RESPONSE_INSTRUCTIONS constant
// =============================================================================

describe('TOOL_RESPONSE_INSTRUCTIONS', () => {
  it('instructs the LLM to ANALYZE tool results', () => {
    expect(TOOL_RESPONSE_INSTRUCTIONS).toContain('ANALYZE');
  });

  it('tells the LLM not to call additional tools', () => {
    expect(TOOL_RESPONSE_INSTRUCTIONS).toContain('DO NOT call additional tools');
  });
});

// =============================================================================
// buildToolResponseSystemPrompt
// =============================================================================

describe('buildToolResponseSystemPrompt', () => {
  it('starts with the same content as buildSystemPrompt', () => {
    const base = buildSystemPrompt(withK8s);
    const toolResp = buildToolResponseSystemPrompt(withK8s);
    expect(toolResp.startsWith(base)).toBe(true);
  });

  it('appends the tool-response instructions suffix', () => {
    const result = buildToolResponseSystemPrompt(withK8s);
    expect(result).toContain('ANALYZE the tool results');
    expect(result).toContain('DO NOT call additional tools');
  });

  it('includes no-k8s content when k8s tool is absent', () => {
    const result = buildToolResponseSystemPrompt(noTools);
    expect(result).toContain('DISABLED');
    expect(result).toContain('ANALYZE the tool results');
  });

  it('includes MCP tools section when tools are present', () => {
    const result = buildToolResponseSystemPrompt({
      ...withK8s,
      mcpTools: [{ name: 'debug_tool', description: 'Debug helper' }],
    });
    expect(result).toContain('debug_tool');
    expect(result).toContain('ANALYZE the tool results');
  });

  it('result is longer than base prompt alone', () => {
    const base = buildSystemPrompt(withK8s);
    const toolResp = buildToolResponseSystemPrompt(withK8s);
    expect(toolResp.length).toBeGreaterThan(base.length);
  });
});

// =============================================================================
// Edge-case / bug regression tests
// =============================================================================

describe('buildMCPToolsSection — edge cases', () => {
  it('BUG (fixed): empty string description falls back to "No description" (|| not ??)', () => {
    // Extraction bug: used ?? which kept empty strings; original used ||.
    // An MCP tool with description:"" would produce "- tool_name: " in the
    // LLM prompt — useless. Fix restores || so any falsy value gets the fallback.
    const section = buildMCPToolsSection([{ name: 'my_tool', description: '' }]);
    expect(section).toContain('my_tool: No description');
  });

  it('undefined description falls back to "No description"', () => {
    expect(buildMCPToolsSection([{ name: 'unnamed' }])).toContain('unnamed: No description');
  });

  it('non-empty description is shown as-is', () => {
    const section = buildMCPToolsSection([{ name: 'tool', description: 'Does X' }]);
    expect(section).toContain('tool: Does X');
  });
});

describe('buildSystemPrompt — section ordering', () => {
  it('MCP section appears before skills text', () => {
    const result = buildSystemPrompt({
      availableTools: ['kubernetes_api_request'],
      mcpTools: [{ name: 'x', description: 'X tool' }],
      skillsText: '\n## SKILL',
      currentContext: undefined,
    });
    expect(result.indexOf('MCP TOOLS AVAILABLE')).toBeLessThan(result.indexOf('## SKILL'));
  });

  it('skills text appears before currentContext', () => {
    const result = buildSystemPrompt({
      availableTools: ['kubernetes_api_request'],
      mcpTools: [],
      skillsText: '\n## SKILL',
      currentContext: 'ns: prod',
    });
    expect(result.indexOf('## SKILL')).toBeLessThan(result.indexOf('CURRENT CONTEXT'));
  });
});
