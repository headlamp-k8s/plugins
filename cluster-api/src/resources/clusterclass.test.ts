vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  ClusterClass,
  extractTemplateRef,
  getClusterClassConditions,
  getClusterClassControlPlaneMachineInfraRef,
  getClusterClassControlPlaneRef,
  getClusterClassInfrastructureRef,
  getControlPlaneHealthChecks,
  getTemplateReference,
  getWorkerBootstrap,
  getWorkerHealthChecks,
  getWorkerInfrastructure,
  isTemplateRefWrapper,
} from './clusterclass';

const ref = { apiVersion: 'infra/v1', kind: 'DockerClusterTemplate', name: 'docker' };

describe('clusterclass resource helpers', () => {
  test('extracts template refs across v1beta1 and v1beta2 shapes', () => {
    expect(isTemplateRefWrapper({ templateRef: ref })).toBe(true);
    expect(isTemplateRefWrapper(ref)).toBe(false);
    expect(extractTemplateRef({ templateRef: ref })).toBe(ref);
    expect(extractTemplateRef({ ref })).toBe(ref);
    expect(extractTemplateRef(ref)).toBe(ref);
    expect(extractTemplateRef(undefined)).toBeUndefined();
  });

  test('resolves template references from direct and nested fields', () => {
    expect(getTemplateReference({ templateRef: ref } as any)).toBe(ref);
    expect(getTemplateReference({ template: { bootstrap: { ref } } } as any, 'bootstrap')).toBe(
      ref
    );
    expect(
      getTemplateReference({ infrastructure: { templateRef: ref } } as any, 'infrastructure')
    ).toBe(ref);
    expect(getTemplateReference(undefined)).toBeUndefined();
  });

  test('normalizes worker and control plane health check shapes', () => {
    const v1beta1Health = { maxUnhealthy: '1' };
    const v1beta2Health = { checks: { nodeStartupTimeoutSeconds: 60 } };

    expect(
      getWorkerHealthChecks({ class: 'md', machineHealthCheck: v1beta1Health } as any)
    ).toEqual({ healthCheck: undefined, machineHealthCheck: v1beta1Health });
    expect(getWorkerHealthChecks({ class: 'md', healthCheck: v1beta2Health } as any)).toEqual({
      healthCheck: v1beta2Health,
      machineHealthCheck: undefined,
    });
    expect(getControlPlaneHealthChecks({ machineHealthCheck: v1beta1Health } as any)).toEqual({
      healthCheck: undefined,
      machineHealthCheck: v1beta1Health,
    });
    expect(getControlPlaneHealthChecks({ healthCheck: v1beta2Health } as any)).toEqual({
      healthCheck: v1beta2Health,
      machineHealthCheck: undefined,
    });
    expect(getControlPlaneHealthChecks(undefined)).toEqual({
      healthCheck: undefined,
      machineHealthCheck: undefined,
    });
  });

  test('normalizes v1beta1 and v1beta2 status conditions', () => {
    expect(
      getClusterClassConditions({
        status: {
          conditions: [{ type: 'Ready', status: 'False' }],
          v1beta2: { conditions: [{ type: 'Available', status: 'False' }] },
        },
      } as any)
    ).toEqual([{ type: 'Available', status: 'False' }]);

    expect(
      getClusterClassConditions({
        status: {
          conditions: [{ type: 'Available', status: 'True' }],
          deprecated: { v1beta1: {} },
        },
      } as any)
    ).toEqual([{ type: 'Available', status: 'True' }]);
  });

  test('returns cluster class infrastructure and control plane refs', () => {
    const machineInfraRef = {
      apiVersion: 'infra/v1',
      kind: 'DockerMachineTemplate',
      name: 'docker-machine',
    };
    const item: any = {
      spec: {
        infrastructure: { templateRef: ref },
        controlPlane: {
          templateRef: {
            apiVersion: 'controlplane/v1',
            kind: 'KubeadmControlPlaneTemplate',
            name: 'cp',
          },
          machineInfrastructure: { templateRef: machineInfraRef },
        },
      },
    };

    expect(getClusterClassInfrastructureRef(item)).toBe(ref);
    expect(getClusterClassControlPlaneRef(item)?.name).toBe('cp');
    expect(getClusterClassControlPlaneMachineInfraRef(item)).toBe(machineInfraRef);
  });

  test('class accessors expose normalized fields and versioned class', () => {
    const item: any = {
      spec: { infrastructure: { templateRef: ref } },
      status: { conditions: [{ type: 'Available', status: 'True' }], deprecated: {} },
    };
    const resource = new ClusterClass(item);
    const V1Beta2 = ClusterClass.withApiVersion('v1beta2');

    expect(ClusterClass.detailsRoute).toBe('/cluster-api/clusterclasses/:namespace/:name');
    expect(V1Beta2.apiVersion).toBe('cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(item.spec);
    expect(resource.status).toBe(item.status);
    expect(resource.conditions).toEqual([{ type: 'Available', status: 'True' }]);
    expect(resource.infrastructureRef).toBe(ref);
  });

  test('worker shortcuts resolve bootstrap and infrastructure references', () => {
    const row: any = {
      class: 'worker',
      template: {
        bootstrap: {
          ref: { apiVersion: 'bootstrap/v1', kind: 'KubeadmConfigTemplate', name: 'boot' },
        },
        infrastructure: { ref },
      },
    };

    expect(getWorkerBootstrap(row)?.name).toBe('boot');
    expect(getWorkerInfrastructure(row)).toBe(ref);
  });
});
