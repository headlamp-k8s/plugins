import { describe, expect, it } from 'vitest';
import { getClusterResourceNamespace } from './clusterResourceNamespace';

function deployment({
  namespace = 'cert-manager',
  args = [],
  configFile = false,
  command = [],
}: {
  namespace?: string;
  args?: string[];
  configFile?: boolean;
  command?: string[];
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
              command,
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

  it('uses the binary default when no namespace override or config file is present', () => {
    expect(getClusterResourceNamespace({ items: [deployment({ namespace: 'cm-system' })] })).toBe(
      'kube-system'
    );
  });

  it('reads namespace flags from command and lets later args override them', () => {
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({
            command: ['controller', '--cluster-resource-namespace=command-secrets'],
          }),
        ],
      })
    ).toBe('command-secrets');
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({
            command: ['controller', '--cluster-resource-namespace=command-secrets'],
            args: ['--cluster-resource-namespace', 'args-secrets'],
          }),
        ],
      })
    ).toBe('args-secrets');
  });

  it('uses the last namespace flag, including Helm extraArgs overrides', () => {
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({
            args: [
              '--cluster-resource-namespace=$(POD_NAMESPACE)',
              '--cluster-resource-namespace=cm-secrets',
            ],
          }),
        ],
      })
    ).toBe('cm-secrets');
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({
            args: [
              '--cluster-resource-namespace=cm-secrets',
              '--cluster-resource-namespace=$(UNKNOWN)',
            ],
          }),
        ],
      })
    ).toBeUndefined();
  });

  it('does not guess when command supplies a config file', () => {
    expect(
      getClusterResourceNamespace({
        items: [deployment({ command: ['controller', '--config', '/etc/config.yaml'] })],
      })
    ).toBeUndefined();
  });

  it('lets an explicit namespace flag override a config file and respects the flag terminator', () => {
    expect(
      getClusterResourceNamespace({
        items: [
          deployment({ configFile: true, args: ['--cluster-resource-namespace=cm-secrets'] }),
        ],
      })
    ).toBe('cm-secrets');
    expect(
      getClusterResourceNamespace({
        items: [deployment({ args: ['--', '--cluster-resource-namespace=ignored'] })],
      })
    ).toBe('kube-system');
  });

  it.each([
    '--cluster-resource-namespace',
    '--cluster-resource-namespace=',
    '--cluster-resource-namespace=BadNamespace',
    '--cluster-resource-namespace=$$(POD_NAMESPACE)',
  ])('does not produce a guessed or invalid namespace from %s', arg => {
    expect(getClusterResourceNamespace({ items: [deployment({ args: [arg] })] })).toBeUndefined();
  });

  it.each(['$(PREFIX)cert-manager', 'cert-manager$(SUFFIX)', '$(MISSING)'])(
    'does not guess a namespace containing unresolved references: %s',
    value => {
      expect(
        getClusterResourceNamespace({
          items: [deployment({ args: [`--cluster-resource-namespace=${value}`] })],
        })
      ).toBeUndefined();
    }
  );

  it('does not guess when a referenced environment value is unavailable', () => {
    const controller = deployment({ args: ['--cluster-resource-namespace=$(PREFIX)cert-manager'] });
    controller.spec.template.spec.containers[0].env.push({
      name: 'PREFIX',
      valueFrom: { fieldRef: { fieldPath: 'metadata.name' } },
    });
    expect(getClusterResourceNamespace({ items: [controller] })).toBeUndefined();
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
