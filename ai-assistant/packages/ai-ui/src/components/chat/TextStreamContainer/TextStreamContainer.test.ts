import { describe, expect, it, vi } from 'vitest';
import type {
  ContentRendererSlotProps,
  EditorDialogSlotProps,
  TextStreamContainerProps,
} from './TextStreamContainer';

// Test the props interface and slot types without rendering (no jsdom)
describe('TextStreamContainer', () => {
  describe('TextStreamContainerProps', () => {
    it('accepts required props', () => {
      const props: TextStreamContainerProps = {
        history: [],
        isLoading: false,
        apiError: null,
      };
      expect(props.history).toEqual([]);
      expect(props.isLoading).toBe(false);
      expect(props.apiError).toBeNull();
    });

    it('accepts optional callback props', () => {
      const onSuccess = vi.fn();
      const onFailure = vi.fn();
      const onYamlAction = vi.fn();
      const onRetryTool = vi.fn();
      const props: TextStreamContainerProps = {
        history: [],
        isLoading: false,
        apiError: null,
        onOperationSuccess: onSuccess,
        onOperationFailure: onFailure,
        onYamlAction: onYamlAction,
        onRetryTool: onRetryTool,
      };
      expect(props.onOperationSuccess).toBe(onSuccess);
      expect(props.onOperationFailure).toBe(onFailure);
      expect(props.onYamlAction).toBe(onYamlAction);
      expect(props.onRetryTool).toBe(onRetryTool);
    });

    it('accepts agentThinkingSteps', () => {
      const steps = [{ type: 'tool-start', tool: 'test', args: {} }];
      const props: TextStreamContainerProps = {
        history: [],
        isLoading: true,
        apiError: null,
        agentThinkingSteps: steps,
      };
      expect(props.agentThinkingSteps).toEqual(steps);
    });

    it('accepts ContentRendererSlot and EditorDialogSlot', () => {
      const MockRenderer = (() => null) as unknown as React.ComponentType<ContentRendererSlotProps>;
      const MockEditor = (() => null) as unknown as React.ComponentType<EditorDialogSlotProps>;
      const props: TextStreamContainerProps = {
        history: [],
        isLoading: false,
        apiError: null,
        ContentRendererSlot: MockRenderer,
        EditorDialogSlot: MockEditor,
      };
      expect(props.ContentRendererSlot).toBe(MockRenderer);
      expect(props.EditorDialogSlot).toBe(MockEditor);
    });
  });

  describe('EditorDialogSlotProps', () => {
    it('accepts all required props', () => {
      const props: EditorDialogSlotProps = {
        open: true,
        onClose: vi.fn(),
        yamlContent: 'apiVersion: v1\nkind: Pod',
        title: 'Apply Pod',
      };
      expect(props.open).toBe(true);
      expect(props.yamlContent).toContain('Pod');
      expect(props.title).toBe('Apply Pod');
    });

    it('accepts optional props', () => {
      const onSuccess = vi.fn();
      const onFailure = vi.fn();
      const props: EditorDialogSlotProps = {
        open: false,
        onClose: vi.fn(),
        yamlContent: '',
        title: 'Test',
        resourceType: 'Deployment',
        isDelete: false,
        onSuccess,
        onFailure,
      };
      expect(props.resourceType).toBe('Deployment');
      expect(props.isDelete).toBe(false);
      expect(props.onSuccess).toBe(onSuccess);
      expect(props.onFailure).toBe(onFailure);
    });
  });

  describe('ContentRendererSlotProps', () => {
    it('accepts content and optional callbacks', () => {
      const onYaml = vi.fn();
      const onRetry = vi.fn();
      const props: ContentRendererSlotProps = {
        content: 'Hello, world!',
        onYamlDetected: onYaml,
        onRetryTool: onRetry,
      };
      expect(props.content).toBe('Hello, world!');
      expect(props.onYamlDetected).toBe(onYaml);
      expect(props.onRetryTool).toBe(onRetry);
    });

    it('accepts content-only', () => {
      const props: ContentRendererSlotProps = {
        content: 'Test content',
      };
      expect(props.content).toBe('Test content');
      expect(props.onYamlDetected).toBeUndefined();
    });
  });
});
