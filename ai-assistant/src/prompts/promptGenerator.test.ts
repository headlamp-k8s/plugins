import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

async function loadGeneratePrompts() {
  vi.resetModules();

  vi.doMock('react', () => ({
    default: { useMemo: vi.fn((fn: () => any) => fn()) },
    useMemo: vi.fn((fn: () => any) => fn()),
  }));

  vi.doMock('react-router-dom', () => ({
    useLocation: vi.fn(() => ({ pathname: '/' })),
  }));

  vi.doMock('../pluginState', () => ({
    useGlobalState: vi.fn(() => ({ event: null })),
  }));

  const module = await import('./promptGenerator');
  return module;
}

describe('generatePrompts', () => {
  it('returns base prompts when no event is provided', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts(null);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What pods need my attention?');
    expect(result[1]).toBe('Show me a simple pod YAML example');
    expect(result[2]).toBe('How do I create a LoadBalancer service?');
  });

  it('returns base prompts for undefined event', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts(undefined);
    expect(result).toHaveLength(3);
  });

  it('returns base prompts for empty event', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({});
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What pods need my attention?');
  });

  it('returns Pod-specific prompts when resource is a Pod', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Pod' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('Why might this pod be failing?');
  });

  it('returns Deployment-specific prompts when resource is a Deployment', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Deployment' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('How can I scale this deployment?');
  });

  it('returns Service-specific prompts when resource is a Service', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Service' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('How do I test this service?');
  });

  it('returns generic resource prompts for unknown resource kind', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'ConfigMap' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns list prompts when resources array is present with Pods', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [{ kind: 'Pod' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What in this list needs my attention?');
    expect(result[1]).toBe('Summarize the status of these resources');
    expect(result[2]).toBe('Which pods are unhealthy?');
  });

  it('returns Node list prompts when resources are Nodes', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [{ kind: 'Node' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What in this list needs my attention?');
    expect(result[1]).toBe('Summarize the status of these resources');
    expect(result[2]).toBe('Which nodes might have issues?');
  });

  it('returns generic list prompts for empty resources array', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What in this list needs my attention?');
    expect(result[1]).toBe('Summarize the status of these resources');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns event prompts when objectEvent has events', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ objectEvent: { events: [{}] } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Explain the recent events');
    expect(result[1]).toBe('What do these warnings mean?');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('prioritizes context prompts over base prompts', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({
      resource: { kind: 'Pod' },
      objectEvent: { events: [{}] },
    });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('Why might this pod be failing?');
  });

  it('always returns at most 3 prompts', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({
      resource: { kind: 'Pod' },
      resources: [{ kind: 'Pod' }],
      objectEvent: { events: [{}] },
    });
    expect(result).toHaveLength(3);
  });
});
