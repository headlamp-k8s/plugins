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

  vi.doMock('@kinvolk/headlamp-plugin/lib', () => ({
    useTranslation: vi.fn(() => ({ t: (key: string) => key })),
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
    const result = generatePrompts({ resource: { kind: 'CustomResource' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns StatefulSet-specific prompts when resource is a StatefulSet', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'StatefulSet' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('Check stateful replica order and PVCs');
  });

  it('returns DaemonSet-specific prompts when resource is a DaemonSet', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'DaemonSet' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('Check daemon rollout across nodes');
  });

  it('returns Job-specific prompts when resource is a Job', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Job' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Why did the last job execution fail?');
  });

  it('returns CronJob-specific prompts when resource is a CronJob', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'CronJob' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Check cron schedule and completion history');
  });

  it('returns Ingress-specific prompts when resource is an Ingress', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Ingress' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Explain backend routing rules and TLS certs');
  });

  it('returns ConfigMap-specific prompts when resource is a ConfigMap', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'ConfigMap' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Show workloads consuming this ConfigMap');
  });

  it('returns Secret-specific prompts when resource is a Secret', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Secret' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Show workloads consuming this Secret');
  });

  it('returns PVC-specific prompts when resource is a PersistentVolumeClaim', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'PersistentVolumeClaim' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Why is this PVC pending or failing to bind?');
  });

  it('returns Namespace-specific prompts when resource is a Namespace', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'Namespace' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Summarize resources and quotas in this namespace');
  });

  it('returns NetworkPolicy-specific prompts when resource is a NetworkPolicy', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resource: { kind: 'NetworkPolicy' } });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Explain ingress and egress traffic rules');
  });

  it('returns list prompts when resources array is present with Pods', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [{ kind: 'Pod' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What in this list needs my attention?');
    expect(result[1]).toBe('Summarize the status of these resources');
    expect(result[2]).toBe('Which pods are unhealthy?');
  });

  it('returns Deployment list prompts when resources are Deployments', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [{ kind: 'Deployment' }] });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Which deployments have replica mismatches?');
  });

  it('returns StatefulSet list prompts when resources are StatefulSets', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [{ kind: 'StatefulSet' }] });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Which statefulsets have unhealthy replicas?');
  });

  it('returns Ingress list prompts when resources are Ingresses', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ resources: [{ kind: 'Ingress' }] });
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('Check ingress TLS certificates');
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

  it('returns route-specific prompts when pathname indicates pods and no event resource is set', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ pathname: '/c/minikube/workloads/pods' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which pods are unhealthy?');
    expect(result[1]).toBe('Show me pods with high resource usage');
  });

  it('returns route-specific prompts when pathname indicates ingresses', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ pathname: '/c/minikube/network/ingresses' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check ingress TLS certificates');
    expect(result[1]).toBe('List all ingress hosts and backend paths');
  });

  it('returns route-specific prompts when pathname indicates storage/PVCs', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ pathname: '/c/minikube/storage/persistentvolumeclaims' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which volume claims are unbound or failing?');
    expect(result[1]).toBe('Summarize PVC storage capacity across namespaces');
  });

  it('returns event prompts when objectEvent has events', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ objectEvent: { events: [{}] } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Explain the recent events');
    expect(result[1]).toBe('What do these warnings mean?');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns project prompts when a project is in context', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ project: { id: 'my-project' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Is everything healthy in this project?');
    expect(result[1]).toBe('Summarize the resources in this project');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns a tab-specific prompt when a project tab is selected', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ project: { id: 'my-project' }, projectTab: 'Workloads' });
    expect(result[2]).toBe('What should I check in the Workloads tab?');
  });

  it('returns project list prompts when projects are in context', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({ projects: [{ id: 'alpha' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which projects need my attention?');
    expect(result[1]).toBe('Summarize the status of these projects');
  });

  it('prioritizes project prompts over resource list prompts', async () => {
    const { generatePrompts } = await loadGeneratePrompts();
    const result = generatePrompts({
      project: { id: 'my-project' },
      resources: [{ kind: 'Pod' }],
    });
    expect(result[0]).toBe('Is everything healthy in this project?');
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

  it('useDynamicPrompts hook formats PromptSuggestion with localized label', async () => {
    const { useDynamicPrompts } = await loadGeneratePrompts();
    const suggestions = useDynamicPrompts();
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toHaveProperty('label');
    expect(suggestions[0]).toHaveProperty('prompt');
  });
});
