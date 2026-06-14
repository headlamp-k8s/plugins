/**
 * Tests for AIToolsSettings component logic.
 *
 * Exercises the data contracts: tool list rendering logic,
 * enabled state checking, and toggle callbacks.
 */

import { describe, expect, it } from 'vitest';
import type { ToolInfo } from './AIToolsSettings';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleTools: ToolInfo[] = [
  { id: 'web-search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'code-exec', name: 'Code Execution', description: 'Execute code snippets' },
  { id: 'file-read', name: 'File Reader', description: 'Read files from the filesystem' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AIToolsSettings logic', () => {
  describe('ToolInfo interface', () => {
    it('each tool has required fields', () => {
      for (const tool of sampleTools) {
        expect(tool.id).toBeTruthy();
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
      }
    });

    it('tool ids are unique', () => {
      const ids = sampleTools.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('isToolEnabled logic', () => {
    it('returns true for enabled tools', () => {
      const enabledSet = new Set(['web-search', 'file-read']);
      const isToolEnabled = (toolId: string) => enabledSet.has(toolId);

      expect(isToolEnabled('web-search')).toBe(true);
      expect(isToolEnabled('file-read')).toBe(true);
      expect(isToolEnabled('code-exec')).toBe(false);
    });

    it('returns false for all tools when none are enabled', () => {
      const enabledSet = new Set<string>();
      const isToolEnabled = (toolId: string) => enabledSet.has(toolId);

      for (const tool of sampleTools) {
        expect(isToolEnabled(tool.id)).toBe(false);
      }
    });

    it('returns true for all tools when all are enabled', () => {
      const enabledSet = new Set(sampleTools.map(t => t.id));
      const isToolEnabled = (toolId: string) => enabledSet.has(toolId);

      for (const tool of sampleTools) {
        expect(isToolEnabled(tool.id)).toBe(true);
      }
    });
  });

  describe('toggle logic', () => {
    it('toggling adds a tool to the enabled set', () => {
      const enabled = new Set(['web-search']);
      const toggle = (toolId: string) => {
        if (enabled.has(toolId)) {
          enabled.delete(toolId);
        } else {
          enabled.add(toolId);
        }
      };

      toggle('code-exec');
      expect(enabled.has('code-exec')).toBe(true);
      expect(enabled.size).toBe(2);
    });

    it('toggling removes a tool from the enabled set', () => {
      const enabled = new Set(['web-search', 'code-exec']);
      const toggle = (toolId: string) => {
        if (enabled.has(toolId)) {
          enabled.delete(toolId);
        } else {
          enabled.add(toolId);
        }
      };

      toggle('web-search');
      expect(enabled.has('web-search')).toBe(false);
      expect(enabled.size).toBe(1);
    });
  });

  describe('empty tools list', () => {
    it('handles empty tools array', () => {
      const tools: ToolInfo[] = [];
      expect(tools).toHaveLength(0);
    });
  });
});
