import { FakeListChatModel } from '@langchain/core/utils/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { createMockKubernetesToolManager, createMockToolManager } from './MockToolManager';

// =============================================================================
// MockToolManager
// =============================================================================

describe('MockToolManager', () => {
  it('does not depend on later ToolManagerAdapter modules', () => {
    const source = readFileSync(resolve(__dirname, 'MockToolManager.ts'), 'utf8');
    expect(source).not.toContain('../langchain/ToolManagerAdapter');
  });
  describe('executeTool — success', () => {
    it('returns a successful ToolResponse with JSON content', async () => {
      const mgr = createMockToolManager({
        toolResults: { my_tool: { pods: ['nginx'] } },
      });
      const response = await mgr.executeTool('my_tool', {});
      expect(response.shouldAddToHistory).toBe(true);
      expect(response.shouldProcessFollowUp).toBe(true);
      expect(JSON.parse(response.content)).toEqual({ pods: ['nginx'] });
    });

    it('uses { result: ok, toolName } as fallback when tool has no configured result', async () => {
      const mgr = createMockToolManager({ enabledToolNames: ['unregistered'] });
      const response = await mgr.executeTool('unregistered', {});
      const parsed = JSON.parse(response.content);
      expect(parsed.result).toBe('ok');
      expect(parsed.toolName).toBe('unregistered');
    });

    it('serialises nested objects correctly', async () => {
      const data = { items: [{ name: 'nginx', status: { phase: 'Running' } }] };
      const mgr = createMockToolManager({ toolResults: { k8s: data } });
      const response = await mgr.executeTool('k8s', {});
      expect(JSON.parse(response.content)).toEqual(data);
    });
  });

  describe('executeTool — error', () => {
    it('throws when the configured result is an Error', async () => {
      const mgr = createMockToolManager({
        toolResults: { bad_tool: new Error('timeout') },
      });
      await expect(mgr.executeTool('bad_tool', {})).rejects.toThrow('timeout');
    });
  });

  describe('onExecuteTool callback', () => {
    it('is called with the tool name and args', async () => {
      const spy = vi.fn();
      const mgr = createMockToolManager({
        toolResults: { my_tool: {} },
        onExecuteTool: spy,
      });
      await mgr.executeTool('my_tool', { namespace: 'default' });
      expect(spy).toHaveBeenCalledWith('my_tool', { namespace: 'default' });
    });
  });

  describe('getToolNames', () => {
    it('defaults to keys of toolResults', () => {
      const mgr = createMockToolManager({
        toolResults: { tool_a: {}, tool_b: {} },
      });
      expect(mgr.getToolNames().sort()).toEqual(['tool_a', 'tool_b']);
    });

    it('uses enabledToolNames when provided', () => {
      const mgr = createMockToolManager({ enabledToolNames: ['only_this'] });
      expect(mgr.getToolNames()).toEqual(['only_this']);
    });

    it('returns empty array when neither option is set', () => {
      expect(createMockToolManager().getToolNames()).toEqual([]);
    });
  });

  describe('hasTool', () => {
    it('returns true for an enabled tool', () => {
      const mgr = createMockToolManager({ enabledToolNames: ['my_tool'] });
      expect(mgr.hasTool('my_tool')).toBe(true);
    });

    it('returns false for an unknown tool', () => {
      expect(createMockToolManager().hasTool('unknown')).toBe(false);
    });
  });

  describe('getMCPTools', () => {
    it('returns an empty array', () => {
      expect(createMockToolManager().getMCPTools()).toEqual([]);
    });
  });

  describe('lifecycle methods', () => {
    it('bindToModelAsync resolves with the model', async () => {
      const model = new FakeListChatModel({ responses: ['ok'] });
      const mgr = createMockToolManager();
      const result = await mgr.bindToModelAsync(model, 'mock');
      expect(result).toBe(model);
    });

    it('waitForMCPToolsInitialization resolves', async () => {
      await expect(
        createMockToolManager().waitForMCPToolsInitialization()
      ).resolves.toBeUndefined();
    });
  });

  describe('function-based tool results', () => {
    it('calls the function with the tool args and returns the result', async () => {
      const fn = vi.fn().mockResolvedValue({ computed: true });
      const mgr = createMockToolManager({
        toolResults: { my_tool: fn },
        enabledToolNames: ['my_tool'],
      });
      const response = await mgr.executeTool('my_tool', { key: 'value' });
      expect(fn).toHaveBeenCalledWith({ key: 'value' }, undefined);
      expect(JSON.parse(response.content)).toEqual({ computed: true });
    });

    it('propagates errors thrown by the function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fn error'));
      const mgr = createMockToolManager({
        toolResults: { bad_tool: fn },
        enabledToolNames: ['bad_tool'],
      });
      await expect(mgr.executeTool('bad_tool', {})).rejects.toThrow('fn error');
    });

    it('passes toolCallId to the function as second argument', async () => {
      const fn = vi.fn().mockReturnValue({});
      const mgr = createMockToolManager({
        toolResults: { t: fn },
        enabledToolNames: ['t'],
      });
      await mgr.executeTool('t', {}, 'call-123');
      expect(fn).toHaveBeenCalledWith({}, 'call-123');
    });
  });
});

// =============================================================================
// createMockKubernetesToolManager
// =============================================================================

describe('createMockKubernetesToolManager', () => {
  it('reports kubernetes_api_request as an enabled tool', () => {
    const mgr = createMockKubernetesToolManager();
    expect(mgr.getToolNames()).toContain('kubernetes_api_request');
    expect(mgr.hasTool('kubernetes_api_request')).toBe(true);
  });

  it('returns pods for /api/v1/pods', async () => {
    const mgr = createMockKubernetesToolManager();
    const response = await mgr.executeTool('kubernetes_api_request', { url: '/api/v1/pods' });
    const data = JSON.parse(response.content);
    expect(data.kind).toBe('List');
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0].kind).toBe('Pod');
  });

  it('returns deployments for /apis/apps/v1/deployments', async () => {
    const mgr = createMockKubernetesToolManager();
    const resp = await mgr.executeTool('kubernetes_api_request', {
      url: '/apis/apps/v1/deployments',
    });
    const data = JSON.parse(resp.content) as { items: Array<{ kind: string }> };
    expect(data.items.every(item => item.kind === 'Deployment')).toBe(true);
  });

  it('returns services for /api/v1/services', async () => {
    const mgr = createMockKubernetesToolManager();
    const resp = await mgr.executeTool('kubernetes_api_request', { url: '/api/v1/services' });
    const data = JSON.parse(resp.content) as { items: Array<{ kind: string }> };
    expect(data.items.every(item => item.kind === 'Service')).toBe(true);
  });

  it('returns nodes for /api/v1/nodes', async () => {
    const mgr = createMockKubernetesToolManager();
    const resp = await mgr.executeTool('kubernetes_api_request', { url: '/api/v1/nodes' });
    const data = JSON.parse(resp.content) as { items: Array<{ kind: string }> };
    expect(data.items.every(item => item.kind === 'Node')).toBe(true);
  });

  it('returns an empty list for unknown resource URLs', async () => {
    const mgr = createMockKubernetesToolManager();
    const resp = await mgr.executeTool('kubernetes_api_request', {
      url: '/apis/custom.io/v1/somethings',
    });
    expect(JSON.parse(resp.content).items).toHaveLength(0);
  });

  it('includes a pod with CrashLoopBackOff status for realistic testing', async () => {
    const mgr = createMockKubernetesToolManager();
    const resp = await mgr.executeTool('kubernetes_api_request', { url: '/api/v1/pods' });
    const pods = (
      JSON.parse(resp.content) as {
        items: Array<{ status?: { phase?: string } }>;
      }
    ).items;
    expect(pods.some(pod => pod.status?.phase === 'CrashLoopBackOff')).toBe(true);
  });

  it('result shouldAddToHistory is true', async () => {
    const mgr = createMockKubernetesToolManager();
    const resp = await mgr.executeTool('kubernetes_api_request', { url: '/api/v1/pods' });
    expect(resp.shouldAddToHistory).toBe(true);
  });
});
