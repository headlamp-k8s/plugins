import { describe, expect, it } from 'vitest';
import { getClusterResourceNamespace } from './clusterResourceNamespace';

function deployment({
  namespace = 'cert-manager',
  args = [],
  configFile = false,
}: {
  namespace?: string;
  args?: string[];
  configFile?: boolean;
} = {}) {
  return {
    metadata: {
      namespace,
      labels: {
        'app.kubernetes.io/name': 'cert-manager',
        'app.kubernetes.io/component': 'controller',
      },
    },
    spec: {
      template: {
        spec: {
          containers: [
            {
              name: 'cert-manager',
              image: 'quay.io/jetstack/cert-manager-controller:v1.18.0',
              args: [...args, ...(configFile ? ['--config=/etc/cert-manager/config.yaml'] : [])],
              env: [
                {
                  name: 'POD_NAMESPACE',
                  valueFrom: { fieldRef: { fieldPath: 'metadata.namespace' } },
                },
              ],
            },
          ],
        },
      },
    },
  };
}

describe('getClusterResourceNamespace', () => {
  it('uses the configured namespace flag', () => {
    expect(
      getClusterResourceNamespace({
        items: [deployment({ args: ['--cluster-resource-namespace=cm-secrets'] })],
      })
    ).toBe('cm-secrets');
  });

  it('resolves the controller namespace environment variable', () => {
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({
            namespace: 'security',
            args: ['--cluster-resource-namespace=$(POD_NAMESPACE)'],
          }),
        ],
      })
    ).toBe('security');
  });

  it('uses cert-manager when the controller has no namespace override or config file', () => {
    expect(getClusterResourceNamespace({ items: [deployment({ namespace: 'cm-system' })] })).toBe(
      'cert-manager'
    );
  });

  it('does not guess when a config file may override the namespace', () => {
    expect(
      getClusterResourceNamespace({ items: [deployment({ configFile: true })] })
    ).toBeUndefined();
  });

  it('does not guess when controller deployments disagree', () => {
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({ args: ['--cluster-resource-namespace=cm-secrets'] }),
          deployment({
            namespace: 'another-cert-manager',
            args: ['--cluster-resource-namespace=other-secrets'],
          }),
        ],
      })
    ).toBeUndefined();
  });

  it('returns undefined when no controller deployment is visible', () => {
    expect(getClusterResourceNamespace({ items: [] })).toBeUndefined();
  });
});
