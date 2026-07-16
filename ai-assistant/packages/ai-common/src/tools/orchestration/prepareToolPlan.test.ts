import { describe, expect, it } from 'vitest';
import type { RecommendedTool } from '../langchain/ToolPlanner';
import {
  buildMultiToolErrorPrompt,
  buildOrchestrationToolError,
  filterApprovedOrchestrationTools,
  shouldCacheResponse,
} from './prepareToolPlan';

const makeTool = (name: string, extra: Partial<RecommendedTool> = {}): RecommendedTool => ({
  name,
  description: `${name} description`,
  arguments: {},
  priority: 'medium',
  reason: 'test',
  ...extra,
});

// =============================================================================
// shouldCacheResponse
// =============================================================================

describe('shouldCacheResponse', () => {
  it('returns true when toolCalls is absent', () => {
    expect(shouldCacheResponse({ role: 'assistant', content: 'hello' })).toBe(true);
  });

  it('returns true when toolCalls is undefined', () => {
    expect(shouldCacheResponse({ role: 'assistant', content: 'hi', toolCalls: undefined })).toBe(
      true
    );
  });

  it('returns true when toolCalls is an empty array', () => {
    expect(shouldCacheResponse({ role: 'assistant', content: 'hi', toolCalls: [] })).toBe(true);
  });

  it('returns false when toolCalls has entries', () => {
    const prompt = {
      role: 'assistant' as const,
      content: '',
      toolCalls: [
        { id: 'c1', type: 'function' as const, function: { name: 't', arguments: '{}' } },
      ],
    };
    expect(shouldCacheResponse(prompt)).toBe(false);
  });

  it('returns false for error responses that contain tool calls', () => {
    const prompt = {
      role: 'assistant' as const,
      content: '',
      error: true,
      toolCalls: [
        { id: 'c1', type: 'function' as const, function: { name: 't', arguments: '{}' } },
      ],
    };
    expect(shouldCacheResponse(prompt)).toBe(false);
  });
});

// =============================================================================
// filterApprovedOrchestrationTools
// =============================================================================

describe('filterApprovedOrchestrationTools', () => {
  it('returns a tool whose exact name was approved (built-in auto-approve path)', () => {
    const tools = [makeTool('kubernetes_api_request')];
    const result = filterApprovedOrchestrationTools(tools, ['kubernetes_api_request']);
    expect(result).toHaveLength(1);
  });

  it('returns a tool whose orchestrated-<name>-<ts> id prefix was approved', () => {
    const tools = [makeTool('my_mcp_tool')];
    const approvedIds = ['orchestrated-my_mcp_tool-1720000000000'];
    expect(filterApprovedOrchestrationTools(tools, approvedIds)).toHaveLength(1);
  });

  it('excludes a tool whose name is not in approvedIds and has no matching prefix', () => {
    const tools = [makeTool('denied_tool')];
    expect(filterApprovedOrchestrationTools(tools, ['other_tool'])).toHaveLength(0);
  });

  it('handles a mix of approved and denied tools', () => {
    const tools = [makeTool('tool_a'), makeTool('tool_b'), makeTool('tool_c')];
    const approved = ['tool_a', 'orchestrated-tool_c-123'];
    const result = filterApprovedOrchestrationTools(tools, approved);
    expect(result.map(t => t.name)).toEqual(['tool_a', 'tool_c']);
  });

  it('returns empty array when approvedIds is empty', () => {
    expect(filterApprovedOrchestrationTools([makeTool('t')], [])).toHaveLength(0);
  });

  it('returns empty array when recommendedTools is empty', () => {
    expect(filterApprovedOrchestrationTools([], ['orchestrated-t-1'])).toHaveLength(0);
  });

  it('does not match a partial name prefix (tool_a should not match tool_ab)', () => {
    const tools = [makeTool('tool_ab')];
    // Approved id has prefix for "tool_a" not "tool_ab"
    expect(filterApprovedOrchestrationTools(tools, ['orchestrated-tool_a-123'])).toHaveLength(0);
  });
});

// =============================================================================
// buildOrchestrationToolError
// =============================================================================

describe('buildOrchestrationToolError', () => {
  it('sets error to true', () => {
    expect(buildOrchestrationToolError('my_tool', null).error).toBe(true);
  });

  it('includes the tool name in the message', () => {
    const result = buildOrchestrationToolError('kubernetes_api', null);
    expect(result.message).toContain('kubernetes_api');
  });

  it('includes the error message when an Error is provided', () => {
    const err = new Error('timeout');
    expect(buildOrchestrationToolError('t', err).message).toContain('timeout');
  });

  it('falls back to "Unknown error" when error is null', () => {
    expect(buildOrchestrationToolError('t', null).message).toContain('Unknown error');
  });

  it('falls back to "Unknown error" when error is undefined', () => {
    expect(buildOrchestrationToolError('t', undefined).message).toContain('Unknown error');
  });

  it('produces a message in the form "Failed to execute <name>: <reason>"', () => {
    const result = buildOrchestrationToolError('exec_tool', new Error('disk full'));
    expect(result.message).toMatch(/^Failed to execute exec_tool: disk full/);
  });
});

// =============================================================================
// buildMultiToolErrorPrompt
// =============================================================================

describe('buildMultiToolErrorPrompt', () => {
  it('returns a prompt with role assistant', () => {
    expect(buildMultiToolErrorPrompt(null).role).toBe('assistant');
  });

  it('sets error to true', () => {
    expect(buildMultiToolErrorPrompt(null).error).toBe(true);
  });

  it('includes the error message when provided', () => {
    const result = buildMultiToolErrorPrompt(new Error('something broke'));
    expect(result.content).toContain('something broke');
  });

  it('uses "Unknown error" when error is null', () => {
    expect(buildMultiToolErrorPrompt(null).content).toContain('Unknown error');
  });

  it('uses "Unknown error" when error is undefined', () => {
    expect(buildMultiToolErrorPrompt(undefined).content).toContain('Unknown error');
  });

  it('suggests the user try again', () => {
    expect(buildMultiToolErrorPrompt(null).content.toLowerCase()).toContain('try');
  });
});
