import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

async function loadPromptGenerator() {
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
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts(null);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What pods need my attention?');
    expect(result[1]).toBe('Show me a simple pod YAML example');
    expect(result[2]).toBe('How do I create a LoadBalancer service?');
  });

  it('returns base prompts for undefined event', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts(undefined);
    expect(result).toHaveLength(3);
  });

  it('returns base prompts for empty event', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({});
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What pods need my attention?');
  });

  it('returns Pod-specific prompts prioritized before generic fallbacks', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Pod' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Why might this pod be failing?');
    expect(result[1]).toBe('How can I debug this pod?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns Deployment-specific prompts when resource is a Deployment', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Deployment' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('How can I scale this deployment?');
    expect(result[1]).toBe('Is this deployment healthy?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns Service-specific prompts when resource is a Service', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Service' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('How do I test this service?');
    expect(result[1]).toBe('What endpoints does this service expose?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns generic resource prompts for unknown resource kind', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'CustomResource' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Anything to notice about this resource?');
    expect(result[1]).toBe('What could be improved here?');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns StatefulSet-specific prompts when resource is a StatefulSet', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'StatefulSet' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check stateful replica order and PVCs');
    expect(result[1]).toBe('Is this StatefulSet rollout healthy?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns DaemonSet-specific prompts when resource is a DaemonSet', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'DaemonSet' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check daemon rollout across nodes');
    expect(result[1]).toBe('Why are daemon pods not scheduling?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns Job-specific prompts when resource is a Job', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Job' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Why did the last job execution fail?');
    expect(result[1]).toBe('How can I inspect active job pods?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns CronJob-specific prompts when resource is a CronJob', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'CronJob' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check cron schedule and completion history');
    expect(result[1]).toBe('Why is this CronJob not triggering?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns Ingress-specific prompts when resource is an Ingress', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Ingress' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Explain backend routing rules and TLS certs');
    expect(result[1]).toBe('Are ingress paths configured correctly?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns ConfigMap-specific prompts when resource is a ConfigMap', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'ConfigMap' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Show workloads consuming this ConfigMap');
    expect(result[1]).toBe('How to mount this ConfigMap in a workload safely');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns Secret-specific prompts when resource is a Secret', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Secret' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Show workloads consuming this Secret');
    expect(result[1]).toBe('How to mount this Secret safely without leaking data');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns PVC-specific prompts when resource is a PersistentVolumeClaim', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'PersistentVolumeClaim' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Why is this PVC pending or failing to bind?');
    expect(result[1]).toBe('Check storage class provisioner and capacity');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns Namespace-specific prompts when resource is a Namespace', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'Namespace' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Summarize resources and quotas in this namespace');
    expect(result[1]).toBe('Check namespace resource limits');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns NetworkPolicy-specific prompts when resource is a NetworkPolicy', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resource: { kind: 'NetworkPolicy' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Explain ingress and egress traffic rules');
    expect(result[1]).toBe('Are pods blocked by this network policy?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('returns list prompts when resources array is present with Pods', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'Pod' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which pods are unhealthy?');
    expect(result[1]).toBe('Show me pods with high resource usage');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns Deployment list prompts when resources are Deployments', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'Deployment' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which deployments have replica mismatches?');
    expect(result[1]).toBe('Summarize deployment rollout statuses');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns StatefulSet list prompts when resources are StatefulSets', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'StatefulSet' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which statefulsets have unhealthy replicas?');
    expect(result[1]).toBe('Summarize statefulset statuses');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns distinct Job list prompts when resources are Jobs', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'Job' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which jobs failed recently?');
    expect(result[1]).toBe('How can I inspect active job pods?');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns distinct CronJob list prompts when resources are CronJobs', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'CronJob' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('List active cron schedules');
    expect(result[1]).toBe('Check cron schedule and completion history');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns Ingress list prompts when resources are Ingresses', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'Ingress' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check ingress TLS certificates');
    expect(result[1]).toBe('List all ingress hosts and backend paths');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns Node list prompts when resources are Nodes', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [{ kind: 'Node' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which nodes might have issues?');
    expect(result[1]).toBe('How is cluster capacity looking?');
    expect(result[2]).toBe('What in this list needs my attention?');
  });

  it('returns generic list prompts for empty resources array', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ resources: [] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What in this list needs my attention?');
    expect(result[1]).toBe('Summarize the status of these resources');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns route-specific prompts when pathname indicates pods and no event resource is set', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ pathname: '/c/minikube/workloads/pods' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which pods are unhealthy?');
    expect(result[1]).toBe('Show me pods with high resource usage');
  });

  it('distinguishes cronjob and job routes accurately', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const cronResult = generatePrompts({ pathname: '/c/minikube/workloads/cronjobs' });
    expect(cronResult[0]).toBe('List active cron schedules');
    expect(cronResult[1]).toBe('Check cron schedule and completion history');

    const jobResult = generatePrompts({ pathname: '/c/minikube/workloads/jobs' });
    expect(jobResult[0]).toBe('Which jobs failed recently?');
    expect(jobResult[1]).toBe('How can I inspect active job pods?');
  });

  it('returns route-specific prompts when pathname indicates ingresses', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ pathname: '/c/minikube/network/ingresses' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Check ingress TLS certificates');
    expect(result[1]).toBe('List all ingress hosts and backend paths');
  });

  it('returns route-specific prompts when pathname indicates persistentvolumeclaims', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ pathname: '/c/minikube/storage/persistentvolumeclaims' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which volume claims are unbound or failing?');
    expect(result[1]).toBe('Summarize PVC storage capacity across namespaces');
  });

  it('does not classify generic storage paths as persistentvolumeclaims', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ pathname: '/c/minikube/storage/storageclasses' });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('What pods need my attention?');
  });

  it('returns event prompts when objectEvent has events', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ objectEvent: { events: [{}] } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Explain the recent events');
    expect(result[1]).toBe('What do these warnings mean?');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns project prompts when a project is in context', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ project: { id: 'my-project' } });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Is everything healthy in this project?');
    expect(result[1]).toBe('Summarize the resources in this project');
    expect(result[2]).toBe('What pods need my attention?');
  });

  it('returns a tab-specific prompt when a project tab is selected', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ project: { id: 'my-project' }, projectTab: 'Workloads' });
    expect(result[2]).toBe('What should I check in the Workloads tab?');
  });

  it('returns project list prompts when projects are in context', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({ projects: [{ id: 'alpha' }] });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Which projects need my attention?');
    expect(result[1]).toBe('Summarize the status of these projects');
  });

  it('prioritizes project prompts over resource list prompts', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({
      project: { id: 'my-project' },
      resources: [{ kind: 'Pod' }],
    });
    expect(result[0]).toBe('Is everything healthy in this project?');
  });

  it('prioritizes context prompts over base prompts', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({
      resource: { kind: 'Pod' },
      objectEvent: { events: [{}] },
    });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Why might this pod be failing?');
    expect(result[1]).toBe('How can I debug this pod?');
    expect(result[2]).toBe('Anything to notice about this resource?');
  });

  it('always returns at most 3 prompts', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const result = generatePrompts({
      resource: { kind: 'Pod' },
      resources: [{ kind: 'Pod' }],
      objectEvent: { events: [{}] },
    });
    expect(result).toHaveLength(3);
  });
});

describe('generatePromptSuggestions & Resource Name Interpolation', () => {
  it('interpolates resource name and namespace in prompt while preserving localized label', async () => {
    const { generatePromptSuggestions } = await loadPromptGenerator();
    const fakeT = (key: string) => `[translated] ${key}`;
    const suggestions = generatePromptSuggestions(
      {
        resource: {
          kind: 'Ingress',
          metadata: { name: 'frontend-ingress', namespace: 'default' },
        },
      },
      fakeT
    );

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].label).toBe('[translated] Explain backend routing rules and TLS certs');
    expect(suggestions[0].prompt).toBe(
      'Explain backend routing rules and TLS certs for ingress frontend-ingress in namespace default'
    );

    expect(suggestions[1].label).toBe('[translated] Are ingress paths configured correctly?');
    expect(suggestions[1].prompt).toBe(
      'Are paths for ingress frontend-ingress in namespace default configured correctly?'
    );

    expect(suggestions[2].label).toBe('[translated] Anything to notice about this resource?');
    expect(suggestions[2].prompt).toBe(
      'Anything to notice about ingress frontend-ingress in namespace default?'
    );
  });

  it('interpolates cluster-scoped resource name without namespace', async () => {
    const { generatePromptSuggestions } = await loadPromptGenerator();
    const suggestions = generatePromptSuggestions({
      resource: {
        kind: 'Node',
        metadata: { name: 'worker-1' },
      },
    });

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].label).toBe('Inspect node conditions, taints, and capacity');
    expect(suggestions[0].prompt).toBe(
      'Inspect conditions, taints, and capacity for node worker-1'
    );
    expect(suggestions[1].label).toBe('Show pods scheduled on this node');
    expect(suggestions[1].prompt).toBe('Show pods scheduled on node worker-1');
  });

  it('interpolates resource name when namespace is omitted on namespaced resource', async () => {
    const { generatePrompts } = await loadPromptGenerator();
    const prompts = generatePrompts({
      resource: {
        kind: 'Pod',
        metadata: { name: 'my-pod' },
      },
    });

    expect(prompts).toHaveLength(3);
    expect(prompts[0]).toBe('Why might pod my-pod be failing?');
    expect(prompts[1]).toBe('How can I debug pod my-pod?');
    expect(prompts[2]).toBe('Anything to notice about pod my-pod?');
  });

  it('useDynamicPrompts hook formats PromptSuggestion with localized label and canonical prompt', async () => {
    const { useDynamicPrompts } = await loadPromptGenerator();
    const suggestions = useDynamicPrompts();
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toHaveProperty('label');
    expect(suggestions[0]).toHaveProperty('prompt');
  });
});
