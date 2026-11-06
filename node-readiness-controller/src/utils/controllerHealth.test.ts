import { describe, expect, it } from 'vitest';
import {
  detectControllerActive,
  findMatchingNRCDeployment,
  getControllerHealth,
  isNRCContainer,
  NRC_LEASE_NAME,
} from './controllerHealth';

describe('controllerHealth', () => {
  const baseNow = new Date('2026-11-01T20:00:00Z').getTime();

  describe('Primary Check: Leader Election Lease', () => {
    it('returns Active (Leader) when lease is renewed within duration grace window', () => {
      const recentTime = new Date(baseNow - 10 * 1000).toISOString(); // 10s ago
      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'nrc-system' },
          spec: {
            holderIdentity: 'nrc-controller-pod-xyz',
            renewTime: recentTime,
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = getControllerHealth({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(true);
      expect(result.reason).toBe('Active (Leader: nrc-controller-pod-xyz)');
      expect(result.status).toBe('active-leader');
      expect(result.badgeLabel).toBe('Active (Leader)');
      expect(result.badgeStatus).toBe('success');
      expect(result.tooltip).toContain('Renewed 10s ago');
      expect(result.details).toEqual({
        type: 'lease',
        holderIdentity: 'nrc-controller-pod-xyz',
        renewAgeSeconds: 10,
      });
    });

    it('falls back to acquireTime if renewTime is missing', () => {
      const acquireTime = new Date(baseNow - 5 * 1000).toISOString();
      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'nrc-system' },
          spec: {
            holderIdentity: 'nrc-fresh-pod',
            acquireTime,
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = getControllerHealth({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(true);
      expect(result.reason).toBe('Active (Leader: nrc-fresh-pod)');
      expect(result.status).toBe('active-leader');
    });

    it('handles multiple leases across namespaces and picks the active fresh lease', () => {
      const staleTime = new Date(baseNow - 60 * 1000).toISOString();
      const freshTime = new Date(baseNow - 5 * 1000).toISOString();

      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'old-system' },
          spec: {
            holderIdentity: 'nrc-old-pod',
            renewTime: staleTime,
            leaseDurationSeconds: 15,
          },
        },
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'nrr-system' },
          spec: {
            holderIdentity: 'nrc-active-pod',
            renewTime: freshTime,
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = getControllerHealth({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(true);
      expect(result.reason).toBe('Active (Leader: nrc-active-pod)');
      expect(result.status).toBe('active-leader');
      expect(result.details?.holderIdentity).toBe('nrc-active-pod');
    });

    it('ignores unowned or released leases without holderIdentity', () => {
      const recentTime = new Date(baseNow - 2 * 1000).toISOString();
      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'released-ns' },
          spec: {
            holderIdentity: '', // released lease
            renewTime: recentTime,
            leaseDurationSeconds: 15,
          },
        },
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'active-ns' },
          spec: {
            holderIdentity: 'nrc-real-leader-pod',
            renewTime: new Date(baseNow - 5 * 1000).toISOString(),
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = getControllerHealth({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(true);
      expect(result.status).toBe('active-leader');
      expect(result.details?.holderIdentity).toBe('nrc-real-leader-pod');
    });

    it('returns Inactive when lease is expired beyond 2x duration window', () => {
      const staleTime = new Date(baseNow - 40 * 1000).toISOString(); // 40s ago > 30s
      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'nrc-system' },
          spec: {
            holderIdentity: 'nrc-controller-pod-xyz',
            renewTime: staleTime,
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = getControllerHealth({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.reason).toBe('Leader lease expired');
      expect(result.status).toBe('inactive');
      expect(result.badgeLabel).toBe('Inactive');
      expect(result.badgeStatus).toBe('error');
      expect(result.tooltip).toContain('Leader lease expired (40s ago, duration window 30s)');
    });

    it('picks the most recently updated lease when all matching leases across namespaces are expired', () => {
      const veryOldTime = new Date(baseNow - 300 * 1000).toISOString(); // 300s ago
      const newerExpiredTime = new Date(baseNow - 50 * 1000).toISOString(); // 50s ago
      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'very-old-ns' },
          spec: {
            holderIdentity: 'nrc-pod-ancient',
            renewTime: veryOldTime,
            leaseDurationSeconds: 15,
          },
        },
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'recent-expired-ns' },
          spec: {
            holderIdentity: 'nrc-pod-recent',
            renewTime: newerExpiredTime,
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = getControllerHealth({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('inactive');
      expect(result.details?.holderIdentity).toBe('nrc-pod-recent');
      expect(result.details?.renewAgeSeconds).toBe(50);
    });

    it('returns Not Detected without deployment fallback when lease query succeeds with 0 leases', () => {
      // Even if ready deployments exist in the cluster, when the user has read access
      // to leases and no lease was found, do NOT fallback to deployment.
      const deployments = [
        {
          metadata: { name: 'node-readiness-controller-manager', namespace: 'nrc-system' },
          spec: {
            replicas: 1,
            template: {
              spec: {
                containers: [
                  {
                    name: 'manager',
                    image: 'registry.k8s.io/node-readiness-controller:v0.1.0',
                  },
                ],
              },
            },
          },
          status: { readyReplicas: 1 },
        },
      ];

      const result = getControllerHealth({
        leases: [],
        leaseError: null,
        deployments,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.reason).toBe('Controller leader lease not found');
      expect(result.status).toBe('not-detected');
      expect(result.badgeLabel).toBe('Not Detected');
      expect(result.badgeStatus).toBe('warning');
    });

    it('returns forbidden and hides badge when no matching lease is found and allowed namespaces are configured', () => {
      const result = getControllerHealth({
        leases: [],
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
        hasRestrictedNamespaces: true,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('forbidden');
      expect(result.reason).toContain('Allowed namespaces configured');
      expect(result.badgeLabel).toBeUndefined();
    });

    it('omits badge and reports not-detected when Lease query fails with non-403 error (e.g. 500)', () => {
      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 500, message: 'Internal Server Error' },
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('not-detected');
      expect(result.badgeLabel).toBeUndefined();
      expect(result.reason).toBe('Internal Server Error');
    });
  });

  describe('Deployment Fallback (ONLY on 403 Forbidden)', () => {
    it('returns loading status when lease is 403 but deployments are still loading', () => {
      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.status).toBe('loading');
      expect(result.active).toBe(false);
    });

    it('returns forbidden status when both lease and deployment queries return 403 Forbidden', () => {
      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments: null,
        deploymentError: { status: 403 },
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('forbidden');
      expect(result.reason).toBe(
        'Access denied: RBAC restricts reading controller lease and deployment'
      );
      expect(result.badgeLabel).toBeUndefined();
    });

    it('omits badge and reports not-detected when lease is 403 but deployment query fails with 500', () => {
      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments: null,
        deploymentError: { status: 500, message: 'Deployment API 500 Error' },
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('not-detected');
      expect(result.badgeLabel).toBeUndefined();
      expect(result.reason).toBe('Deployment API 500 Error');
    });

    it('returns Active via deployment fallback when lease is 403 and ready deployment exists', () => {
      const deployments = [
        {
          metadata: { name: 'node-readiness-controller-manager', namespace: 'nrc-system' },
          spec: {
            replicas: 2,
            template: {
              spec: {
                containers: [
                  {
                    name: 'manager',
                    image: 'registry.k8s.io/node-readiness-controller:v0.1.0',
                  },
                ],
              },
            },
          },
          status: { readyReplicas: 2 },
        },
      ];

      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(true);
      expect(result.status).toBe('active-deployment');
      expect(result.badgeLabel).toBe('Active');
      expect(result.badgeStatus).toBe('success');
      expect(result.reason).toBe(
        'Lease access restricted by RBAC; verified via ready deployment replicas'
      );
      expect(result.tooltip).toContain(
        'Lease access restricted by RBAC; verified via ready deployment replicas: node-readiness-controller-manager (2 replicas)'
      );
      expect(result.details).toEqual({
        type: 'deployment',
        deploymentName: 'node-readiness-controller-manager',
        readyReplicas: 2,
      });
    });

    it('returns Inactive when lease is 403 and matching deployment has 0 ready replicas', () => {
      const deployments = [
        {
          metadata: { name: 'node-readiness-controller-manager', namespace: 'nrc-system' },
          spec: {
            replicas: 1,
            template: {
              spec: {
                containers: [
                  {
                    name: 'manager',
                    image: 'registry.k8s.io/node-readiness-controller:v0.1.0',
                  },
                ],
              },
            },
          },
          status: { readyReplicas: 0 },
        },
      ];

      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('inactive');
      expect(result.badgeLabel).toBe('Inactive');
      expect(result.badgeStatus).toBe('error');
      expect(result.reason).toBe('Deployment has 0 ready replicas');
    });

    it('returns Inactive with scaled to 0 message when deployment is confirmed scaled down', () => {
      const deployments = [
        {
          metadata: { name: 'nrc-ha-controller', namespace: 'nrc-system' },
          spec: {
            replicas: 0,
            template: {
              spec: {
                containers: [
                  {
                    name: 'manager',
                    image: 'registry.k8s.io/node-readiness-controller:v0.1.0',
                  },
                ],
              },
            },
          },
          status: { replicas: 0, readyReplicas: 0 },
        },
      ];

      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('inactive');
      expect(result.badgeLabel).toBe('Inactive');
      expect(result.reason).toBe('Deployment scaled to 0 replicas');
    });

    it('returns forbidden status when lease is 403 and no matching NRC deployment exists', () => {
      const deployments = [
        {
          metadata: { name: 'unrelated-coredns', namespace: 'kube-system' },
          spec: {
            template: {
              spec: {
                containers: [{ name: 'coredns', image: 'coredns/coredns:1.8.0' }],
              },
            },
          },
          status: { readyReplicas: 2 },
        },
      ];

      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('forbidden');
      expect(result.reason).toContain('Access denied: RBAC restricts reading controller lease');
      expect(result.badgeLabel).toBeUndefined();
    });

    it('returns forbidden status with restricted namespaces reason when lease is 403, deployments empty/unmatched, and allowed namespaces are configured', () => {
      const result = getControllerHealth({
        leases: null,
        leaseError: { status: 403 },
        deployments: [],
        deploymentError: null,
        now: baseNow,
        hasRestrictedNamespaces: true,
      });

      expect(result.active).toBe(false);
      expect(result.status).toBe('forbidden');
      expect(result.reason).toContain(
        'Allowed namespaces configured; cannot verify controller deployment'
      );
      expect(result.badgeLabel).toBeUndefined();
    });
  });

  describe('findMatchingNRCDeployment and isNRCContainer helpers', () => {
    it('identifies NRC containers by image or command and excludes sidecars', () => {
      expect(isNRCContainer({ image: 'registry.k8s.io/node-readiness-controller:v0.1.0' })).toBe(
        true
      );
      expect(isNRCContainer({ image: 'ghcr.io/org/nrrcontroller:latest' })).toBe(true);
      expect(isNRCContainer({ image: 'docker.io/nrr-controller:v1' })).toBe(true);
      expect(isNRCContainer({ image: 'custom-repo/controller', command: ['/manager'] })).toBe(true);
      expect(isNRCContainer({ image: 'gcr.io/kubebuilder/kube-rbac-proxy:v0.13.1' })).toBe(false);
      expect(isNRCContainer({ image: 'coredns/coredns:1.8.0', command: ['/coredns'] })).toBe(false);
    });

    it('prefers a ready deployment candidate over an inactive candidate with 0 ready replicas', () => {
      const oldDeployment = {
        metadata: { name: 'nrc-old' },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'registry.k8s.io/node-readiness-controller:v0.1.0' }],
            },
          },
        },
        status: { readyReplicas: 0 },
      };
      const readyDeployment = {
        metadata: { name: 'nrc-ready' },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'registry.k8s.io/node-readiness-controller:v0.1.0' }],
            },
          },
        },
        status: { readyReplicas: 2 },
      };

      const matched = findMatchingNRCDeployment([oldDeployment, readyDeployment]);
      expect(matched?.metadata?.name).toBe('nrc-ready');
    });

    it('falls back to the first candidate if no ready candidate exists', () => {
      const d1 = {
        metadata: { name: 'nrc-1' },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'registry.k8s.io/node-readiness-controller:v0.1.0' }],
            },
          },
        },
        status: { readyReplicas: 0 },
      };
      const d2 = {
        metadata: { name: 'nrc-2' },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'registry.k8s.io/node-readiness-controller:v0.1.0' }],
            },
          },
        },
        status: { readyReplicas: 0 },
      };

      const matched = findMatchingNRCDeployment([d1, d2]);
      expect(matched?.metadata?.name).toBe('nrc-1');
    });

    it('returns undefined if deployments list is null or empty', () => {
      expect(findMatchingNRCDeployment(null)).toBeUndefined();
      expect(findMatchingNRCDeployment([])).toBeUndefined();
    });
  });

  describe('detectControllerActive helper', () => {
    it('returns boolean active flag and diagnostic reasoning', () => {
      const recentTime = new Date(baseNow - 10 * 1000).toISOString();
      const leases = [
        {
          metadata: { name: NRC_LEASE_NAME, namespace: 'nrc-system' },
          spec: {
            holderIdentity: 'nrc-pod',
            renewTime: recentTime,
            leaseDurationSeconds: 15,
          },
        },
      ];

      const result = detectControllerActive({
        leases,
        leaseError: null,
        deployments: null,
        deploymentError: null,
        now: baseNow,
      });

      expect(result.active).toBe(true);
      expect(result.reason).toBe('Active (Leader: nrc-pod)');
    });
  });
});
