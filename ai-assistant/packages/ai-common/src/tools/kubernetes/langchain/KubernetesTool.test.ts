/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type {
  KubernetesAIManagerContext,
  KubernetesToolContext,
  KubernetesToolUICallbacks,
  KubernetesToolUIState,
} from '../context';
import { KubernetesTool } from './KubernetesTool';

describe('KubernetesTool config', () => {
  it('advertises PATCH as a supported HTTP method', () => {
    const tool = new KubernetesTool();
    const schema = z.toJSONSchema(tool.config.schema) as {
      properties?: { method?: { description?: string } };
    };

    expect(schema.properties?.method?.description).toContain('PATCH');
  });
});

describe('tools/kubernetes/context', () => {
  it('KubernetesToolUIState holds showApiConfirmation and apiRequest', () => {
    const state: KubernetesToolUIState = {
      showApiConfirmation: true,
      apiRequest: { method: 'GET', url: '/api/v1/pods' },
      apiResponse: null,
      apiLoading: false,
      apiRequestError: null,
    };
    expect(state.showApiConfirmation).toBe(true);
    expect(state.apiRequest?.method).toBe('GET');
  });

  it('KubernetesToolContext holds ui, callbacks, and selectedClusters', () => {
    const ui: KubernetesToolUIState = {
      showApiConfirmation: false,
      apiRequest: null,
      apiResponse: null,
      apiLoading: false,
      apiRequestError: null,
    };
    const callbacks: KubernetesToolUICallbacks = {
      setShowApiConfirmation: () => {},
      setApiRequest: () => {},
      setApiResponse: () => {},
      setApiLoading: () => {},
      setApiRequestError: () => {},
      handleActualApiRequest: async () => {},
    };
    const ctx: KubernetesToolContext = { ui, callbacks, selectedClusters: ['prod'] };
    expect(ctx.selectedClusters).toEqual(['prod']);
  });
});

/** Minimal valid KubernetesToolContext for isContextDifferent tests. */
function makeCtx(clusters: string[]): KubernetesToolContext {
  const ui: KubernetesToolUIState = {
    showApiConfirmation: false,
    apiRequest: null,
    apiResponse: null,
    apiLoading: false,
    apiRequestError: null,
  };
  const callbacks: KubernetesToolUICallbacks = {
    setShowApiConfirmation: () => {},
    setApiRequest: () => {},
    setApiResponse: () => {},
    setApiLoading: () => {},
    setApiRequestError: () => {},
    handleActualApiRequest: async () => {},
  };
  return { ui, callbacks, selectedClusters: clusters };
}

describe('KubernetesTool.isContextDifferent', () => {
  it('returns true when no context has been set yet', () => {
    const tool = new KubernetesTool();
    expect(tool.isContextDifferent(makeCtx(['a']))).toBe(true);
  });

  it('returns false when the same clusters are provided in the same order', () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['a', 'b']));
    expect(tool.isContextDifferent(makeCtx(['a', 'b']))).toBe(false);
  });

  it('returns false when the same clusters are provided in a different order', () => {
    // Regression: JSON.stringify(['b','a']) !== JSON.stringify(['a','b']), so
    // order-sensitive comparison would incorrectly trigger reconfiguration.
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['a', 'b']));
    expect(tool.isContextDifferent(makeCtx(['b', 'a']))).toBe(false);
  });

  it('returns true when clusters are genuinely different', () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['a', 'b']));
    expect(tool.isContextDifferent(makeCtx(['a', 'c']))).toBe(true);
  });

  it('returns true when a cluster is added', () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['a']));
    expect(tool.isContextDifferent(makeCtx(['a', 'b']))).toBe(true);
  });

  it('returns true when a cluster is removed', () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['a', 'b']));
    expect(tool.isContextDifferent(makeCtx(['a']))).toBe(true);
  });
});

describe('KubernetesTool.handleApiConfirmation — toolCallId tagging', () => {
  it('tags the history entry with the toolCallId captured before clearing apiRequest', async () => {
    const tool = new KubernetesTool();

    // Simulate a history array that handleActualApiRequest pushes a 'tool' entry into.
    const history: Array<{ role: string; toolCallId?: string; name?: string }> = [];

    const aiManager = { history };

    const ctx = makeCtx(['prod']);
    ctx.aiManager = aiManager;

    // Provide a handleActualApiRequest stub that pushes an untagged tool entry.
    ctx.callbacks.handleActualApiRequest = async () => {
      history.push({ role: 'tool' }); // untagged, as handleActualApiRequest normally does
    };

    tool.setContext(ctx);

    // Simulate the confirmation dialog having been opened for a POST with a known toolCallId.
    // Set directly on ui (setApiRequest is a stub that doesn't mutate ui).
    ctx.ui.apiRequest = {
      url: '/api/v1/namespaces',
      method: 'POST',
      body: '{}',
      toolCallId: 'call-abc-123',
    };

    await tool.handleApiConfirmation('{}', {});

    // The entry pushed by handleActualApiRequest must now carry the toolCallId.
    expect(history).toHaveLength(1);
    expect(history[0].toolCallId).toBe('call-abc-123');
    expect(history[0].name).toBe('kubernetes_api_request');
  });

  it('does not tag if toolCallId was absent on the request', async () => {
    const tool = new KubernetesTool();
    const history: Array<{ role: string; toolCallId?: string }> = [];
    const aiManager = { history };
    const ctx = makeCtx([]);
    ctx.aiManager = aiManager;
    ctx.callbacks.handleActualApiRequest = async () => {
      history.push({ role: 'tool' });
    };
    tool.setContext(ctx);
    ctx.ui.apiRequest = { url: '/api/v1/pods', method: 'DELETE' }; // no toolCallId
    await tool.handleApiConfirmation('', {});
    // Entry should remain untagged
    expect(history[0].toolCallId).toBeUndefined();
  });

  it('GET handler does not tag history entries when toolCallId is undefined', async () => {
    // Regression: the GET path previously tagged unconditionally, which could
    // overwrite `name` on an unrelated 'tool' entry that happened to be last.
    const tool = new KubernetesTool();
    const pre = {
      role: 'tool',
      toolCallId: undefined as string | undefined,
      name: 'unrelated_tool',
    };
    const aiManager = { history: [pre] };
    const ctx = makeCtx(['prod']);
    ctx.aiManager = aiManager;
    ctx.callbacks.handleActualApiRequest = async () => {};
    tool.setContext(ctx);

    // Invoke the handler with toolCallId = undefined
    await tool.handler({ url: '/api/v1/pods', method: 'GET', body: '' }, undefined, undefined);

    // The pre-existing entry must be untouched
    expect(pre.name).toBe('unrelated_tool');
    expect(pre.toolCallId).toBeUndefined();
  });

  it('non-PATCH confirmation content omits fullResource field', () => {
    // Regression: `fullResource: method === 'PATCH' && body` evaluates to
    // `false` for non-PATCH methods, polluting the JSON shape.
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    ctx.callbacks.handleActualApiRequest = async () => {};
    ctx.callbacks.setShowApiConfirmation = () => {};
    ctx.callbacks.setApiRequest = () => {};
    tool.setContext(ctx);

    // Directly invoke the handler for a DELETE — content must not have fullResource
    ctx.callbacks.setApiRequest = () => {
      // capture the content via the pending_confirmation path by parsing after return
    };

    // Access the content by calling the handler and checking its return value
    const resultP = tool.handler(
      { url: '/api/v1/pods/foo', method: 'DELETE', body: '' },
      'call-1',
      undefined
    );
    return resultP.then(result => {
      const parsed = JSON.parse(result.content);
      expect(Object.prototype.hasOwnProperty.call(parsed, 'fullResource')).toBe(false);
    });
  });
});

// ── hasContext ────────────────────────────────────────────────────────────────

describe('KubernetesTool.hasContext', () => {
  it('returns false when no context has been set', () => {
    const tool = new KubernetesTool();
    expect(tool.hasContext()).toBe(false);
  });

  it('returns true after setContext is called', () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['cluster-1']));
    expect(tool.hasContext()).toBe(true);
  });
});

// ── handler — GET error path ──────────────────────────────────────────────────

describe('KubernetesTool.handler — GET error path', () => {
  it('returns error content when handleActualApiRequest throws', async () => {
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    ctx.callbacks.handleActualApiRequest = async () => {
      throw new Error('network timeout');
    };
    tool.setContext(ctx);

    const result = await tool.handler(
      { url: '/api/v1/pods', method: 'get', body: '' },
      undefined,
      undefined
    );
    const parsed = JSON.parse(result.content);

    expect(parsed.error).toBe(true);
    expect(parsed.message).toContain('network timeout');
    expect(parsed.request.method).toBe('GET');
    expect(result.shouldAddToHistory).toBe(true);
    expect(result.shouldProcessFollowUp).toBe(true);
  });

  it('GET error sets error metadata', async () => {
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    ctx.callbacks.handleActualApiRequest = async () => {
      throw new Error('bad request');
    };
    tool.setContext(ctx);

    const result = await tool.handler(
      { url: '/api/v1/pods', method: 'GET', body: '' },
      undefined,
      undefined
    );
    expect(result.metadata?.error).toContain('bad request');
  });
});

// ── handler — GET success with toolCallId tagging ─────────────────────────────

describe('KubernetesTool.handler — GET toolCallId tagging', () => {
  it('tags the last untagged tool history entry with toolCallId', async () => {
    const tool = new KubernetesTool();
    const history: KubernetesAIManagerContext['history'] = [
      { role: 'user', content: 'list pods' },
      { role: 'tool', content: '{}', toolCallId: undefined },
    ];
    const ctx = makeCtx(['prod']);
    ctx.callbacks.handleActualApiRequest = async () => ({ items: [] });
    ctx.aiManager = { history };
    tool.setContext(ctx);

    await tool.handler({ url: '/api/v1/pods', method: 'GET', body: '' }, 'tc-99', undefined);

    expect(history[1].toolCallId).toBe('tc-99');
    expect(history[1].name).toBe('kubernetes_api_request');
  });

  it('does not tag when toolCallId is undefined', async () => {
    const tool = new KubernetesTool();
    const history: KubernetesAIManagerContext['history'] = [{ role: 'tool', content: '{}' }];
    const ctx = makeCtx(['prod']);
    ctx.callbacks.handleActualApiRequest = async () => ({});
    ctx.aiManager = { history };
    tool.setContext(ctx);

    await tool.handler({ url: '/api/v1/pods', method: 'GET', body: '' }, undefined, undefined);

    expect(history[0].toolCallId).toBeUndefined();
  });

  it('does not tag already-tagged entries', async () => {
    const tool = new KubernetesTool();
    const history: KubernetesAIManagerContext['history'] = [
      { role: 'tool', content: '{}', toolCallId: 'existing-tc' },
    ];
    const ctx = makeCtx(['prod']);
    ctx.callbacks.handleActualApiRequest = async () => ({});
    ctx.aiManager = { history };
    tool.setContext(ctx);

    await tool.handler({ url: '/api/v1/pods', method: 'GET', body: '' }, 'new-tc', undefined);

    expect(history[0].toolCallId).toBe('existing-tc');
  });
});

// ── handler — non-GET (confirmation) path ─────────────────────────────────────

describe('KubernetesTool.handler — non-GET confirmation path', () => {
  it('rejects non-string URL and method arguments', async () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['prod']));

    await expect(
      tool.handler({ url: 42, method: 'POST' }, 'tc-invalid', undefined)
    ).rejects.toThrow('requires string url and method');
  });

  it('rejects a non-string request body', async () => {
    const tool = new KubernetesTool();
    tool.setContext(makeCtx(['prod']));

    await expect(
      tool.handler(
        { url: '/api/v1/pods', method: 'POST', body: { spec: {} } },
        'tc-invalid-body',
        undefined
      )
    ).rejects.toThrow('body must be a string');
  });

  it('calls setApiRequest and setShowApiConfirmation for POST', async () => {
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    const captured: { request: KubernetesToolUIState['apiRequest'] } = { request: null };
    let confirmationShown = false;
    ctx.callbacks.setApiRequest = req => {
      captured.request = req;
    };
    ctx.callbacks.setShowApiConfirmation = (v: boolean) => {
      confirmationShown = v;
    };
    tool.setContext(ctx);

    const result = await tool.handler(
      { url: '/api/v1/pods', method: 'POST', body: '{"spec":{}}' },
      'tc-post',
      undefined
    );

    expect(captured.request?.url).toBe('/api/v1/pods');
    expect(captured.request?.method).toBe('POST');
    expect(captured.request?.toolCallId).toBe('tc-post');
    expect(confirmationShown).toBe(true);
    expect(result.shouldAddToHistory).toBe(false);
    expect(result.shouldProcessFollowUp).toBe(false);
    expect(result.metadata?.requiresConfirmation).toBe(true);
  });

  it('returns pending_confirmation status for DELETE', async () => {
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    ctx.callbacks.setApiRequest = () => {};
    ctx.callbacks.setShowApiConfirmation = () => {};
    tool.setContext(ctx);

    const result = await tool.handler(
      { url: '/api/v1/pods/my-pod', method: 'delete', body: '' },
      'tc-del',
      undefined
    );

    const parsed = JSON.parse(result.content);
    expect(parsed.status).toBe('pending_confirmation');
    expect(parsed.request.method).toBe('DELETE');
  });

  it('PATCH confirmation includes fullResource when body is present', async () => {
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    ctx.callbacks.setApiRequest = () => {};
    ctx.callbacks.setShowApiConfirmation = () => {};
    tool.setContext(ctx);

    const patchBody = '{"spec":{"replicas":2}}';
    const result = await tool.handler(
      { url: '/api/v1/deployments/d1', method: 'PATCH', body: patchBody },
      'tc-patch',
      undefined
    );

    const parsed = JSON.parse(result.content);
    expect(parsed.fullResource).toBe(patchBody);
  });
});

// ── handleApiDialogClose ──────────────────────────────────────────────────────

describe('KubernetesTool.handleApiDialogClose', () => {
  it('clears all UI state when context is set', () => {
    const tool = new KubernetesTool();
    const ctx = makeCtx(['prod']);
    const state: KubernetesToolUIState = {
      showApiConfirmation: true,
      apiRequest: { url: '/api/v1/pods', method: 'GET' },
      apiResponse: '{"items":[]}',
      apiLoading: true,
      apiRequestError: 'some error',
    };
    ctx.callbacks.setShowApiConfirmation = v => {
      state.showApiConfirmation = v;
    };
    ctx.callbacks.setApiRequest = v => {
      state.apiRequest = v;
    };
    ctx.callbacks.setApiResponse = v => {
      state.apiResponse = v;
    };
    ctx.callbacks.setApiLoading = v => {
      state.apiLoading = v;
    };
    ctx.callbacks.setApiRequestError = v => {
      state.apiRequestError = v;
    };
    tool.setContext(ctx);

    tool.handleApiDialogClose();

    expect(state.showApiConfirmation).toBe(false);
    expect(state.apiRequest).toBeNull();
    expect(state.apiResponse).toBeNull();
    expect(state.apiRequestError).toBeNull();
    expect(state.apiLoading).toBe(false);
  });

  it('is a no-op when no context is set', () => {
    const tool = new KubernetesTool();
    expect(() => tool.handleApiDialogClose()).not.toThrow();
  });
});
