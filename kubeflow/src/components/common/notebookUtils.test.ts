import {
  aggregateNotebookResources,
  getNotebookStatus,
  getNotebookType,
  getProfileStatus,
  parseCpuQuantity,
  parseMemoryQuantity,
} from './notebookUtils';

// ── getNotebookStatus ──────────────────────────────────────────────────────────

describe('getNotebookStatus', () => {
  it('returns Running when readyReplicas > 0', () => {
    const result = getNotebookStatus({
      status: { readyReplicas: 1 },
    });
    expect(result.label).toBe('Running');
    expect(result.status).toBe('success');
    expect(result.icon).toBe('mdi:check-circle');
  });

  it('returns Running when readyReplicas > 1', () => {
    const result = getNotebookStatus({
      status: { readyReplicas: 3 },
    });
    expect(result.label).toBe('Running');
    expect(result.status).toBe('success');
  });

  it('returns Failed when a Failed condition is present', () => {
    const result = getNotebookStatus({
      status: {
        readyReplicas: 0,
        conditions: [
          { type: 'Failed', status: 'True', reason: 'OOMKilled', message: 'Out of memory' },
        ],
      },
    });
    expect(result.label).toBe('Failed');
    expect(result.status).toBe('error');
    expect(result.icon).toBe('mdi:alert-circle');
    expect(result.reason).toBe('OOMKilled');
  });

  it('returns Failed with message fallback when reason is missing', () => {
    const result = getNotebookStatus({
      status: {
        conditions: [{ type: 'Failed', status: 'True', message: 'Container crashed' }],
      },
    });
    expect(result.label).toBe('Failed');
    expect(result.reason).toBe('Container crashed');
  });

  it('returns error status for ImagePullBackOff container waiting state', () => {
    const result = getNotebookStatus({
      status: {
        containerState: {
          waiting: { reason: 'ImagePullBackOff', message: 'pulling image failed' },
        },
      },
    });
    expect(result.label).toBe('ImagePullBackOff');
    expect(result.status).toBe('error');
    expect(result.icon).toBe('mdi:alert-circle');
    expect(result.reason).toBe('pulling image failed');
  });

  it('returns error status for CrashLoopBackOff container waiting state', () => {
    const result = getNotebookStatus({
      status: {
        containerState: {
          waiting: { reason: 'CrashLoopBackOff' },
        },
      },
    });
    expect(result.label).toBe('CrashLoopBackOff');
    expect(result.status).toBe('error');
  });

  it('returns error status for ErrImagePull container waiting state', () => {
    const result = getNotebookStatus({
      status: {
        containerState: {
          waiting: { reason: 'ErrImagePull' },
        },
      },
    });
    expect(result.label).toBe('ErrImagePull');
    expect(result.status).toBe('error');
  });

  it('returns non-error Waiting for generic container waiting state', () => {
    const result = getNotebookStatus({
      status: {
        containerState: {
          waiting: { reason: 'ContainerCreating' },
        },
      },
    });
    expect(result.label).toBe('ContainerCreating');
    expect(result.status).toBe('');
    expect(result.icon).toBe('mdi:clock-outline');
  });

  it('falls back to "Waiting" label when container waiting reason is empty', () => {
    const result = getNotebookStatus({
      status: {
        containerState: { waiting: {} },
      },
    });
    expect(result.label).toBe('Waiting');
  });

  it('returns error for Waiting condition with BackOff reason', () => {
    const result = getNotebookStatus({
      status: {
        conditions: [
          { type: 'Waiting', status: 'True', reason: 'CrashLoopBackOff', message: 'restarting' },
        ],
      },
    });
    expect(result.label).toBe('CrashLoopBackOff');
    expect(result.status).toBe('error');
    expect(result.reason).toBe('restarting');
  });

  it('returns Running for Running condition True', () => {
    const result = getNotebookStatus({
      status: {
        conditions: [{ type: 'Running', status: 'True' }],
      },
    });
    expect(result.label).toBe('Running');
    expect(result.status).toBe('success');
  });

  it('returns Running for Ready condition True', () => {
    const result = getNotebookStatus({
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
      },
    });
    expect(result.label).toBe('Running');
    expect(result.status).toBe('success');
  });

  it('returns Terminated for terminated container state', () => {
    const result = getNotebookStatus({
      status: {
        containerState: {
          terminated: { reason: 'Completed', exitCode: 0 },
        },
      },
    });
    expect(result.label).toBe('Completed');
    expect(result.status).toBe('error');
    expect(result.icon).toBe('mdi:stop-circle');
    expect(result.reason).toBe('Exit code: 0');
  });

  it('returns Terminated with default label when reason is missing', () => {
    const result = getNotebookStatus({
      status: {
        containerState: { terminated: { exitCode: 137 } },
      },
    });
    expect(result.label).toBe('Terminated');
    expect(result.reason).toBe('Exit code: 137');
  });

  it('returns last condition type when no other state matches', () => {
    const result = getNotebookStatus({
      status: {
        conditions: [
          { type: 'Initializing', status: 'False' },
          { type: 'Scheduling', status: 'False' },
        ],
      },
    });
    expect(result.label).toBe('Scheduling');
    expect(result.status).toBe('');
  });

  it('returns Pending when no status or conditions exist', () => {
    const result = getNotebookStatus({});
    expect(result.label).toBe('Pending');
    expect(result.status).toBe('');
    expect(result.icon).toBe('mdi:clock-outline');
  });

  it('returns Pending when jsonData is null', () => {
    const result = getNotebookStatus(null);
    expect(result.label).toBe('Pending');
  });

  it('returns Pending when jsonData is undefined', () => {
    const result = getNotebookStatus(undefined);
    expect(result.label).toBe('Pending');
  });

  it('prioritizes readyReplicas over conditions', () => {
    const result = getNotebookStatus({
      status: {
        readyReplicas: 1,
        conditions: [{ type: 'Failed', status: 'True', reason: 'stale' }],
      },
    });
    expect(result.label).toBe('Running');
    expect(result.status).toBe('success');
  });

  it('prioritizes Failed condition over waiting container state', () => {
    const result = getNotebookStatus({
      status: {
        conditions: [{ type: 'Failed', status: 'True', reason: 'DeadlineExceeded' }],
        containerState: { waiting: { reason: 'ContainerCreating' } },
      },
    });
    expect(result.label).toBe('Failed');
    expect(result.status).toBe('error');
  });
});

// ── getNotebookType ────────────────────────────────────────────────────────────

describe('getNotebookType', () => {
  it('detects Jupyter from image name', () => {
    const result = getNotebookType('kubeflownotebookswg/jupyter-scipy:v1.8.0');
    expect(result.label).toBe('Jupyter');
    expect(result.icon).toBe('mdi:language-python');
    expect(result.color).toBe('warning');
  });

  it('detects Jupyter from scipy image', () => {
    expect(getNotebookType('scipy-notebook:latest').label).toBe('Jupyter');
  });

  it('detects Jupyter from tensorflow image', () => {
    expect(getNotebookType('tensorflow/tensorflow:2.12.0-jupyter').label).toBe('Jupyter');
  });

  it('detects Jupyter from pytorch image', () => {
    expect(getNotebookType('pytorch/pytorch:2.0.0').label).toBe('Jupyter');
  });

  it('detects VS Code from codeserver image', () => {
    const result = getNotebookType('kubeflownotebookswg/codeserver-python:v1.8.0');
    expect(result.label).toBe('VS Code');
    expect(result.icon).toBe('mdi:microsoft-visual-studio-code');
    expect(result.color).toBe('info');
  });

  it('detects VS Code from vscode image', () => {
    expect(getNotebookType('my-registry/vscode-server:latest').label).toBe('VS Code');
  });

  it('detects RStudio from image name', () => {
    const result = getNotebookType('kubeflownotebookswg/rstudio-tidyverse:v1.8.0');
    expect(result.label).toBe('RStudio');
    expect(result.icon).toBe('mdi:language-r');
    expect(result.color).toBe('secondary');
  });

  it('detects RStudio from tidyverse image', () => {
    expect(getNotebookType('rocker/tidyverse:4.3.0').label).toBe('RStudio');
  });

  it('returns Custom for unrecognized images', () => {
    const result = getNotebookType('my-company/custom-ml-env:v2');
    expect(result.label).toBe('Custom');
    expect(result.icon).toBe('mdi:cube-outline');
    expect(result.color).toBe('default');
  });

  it('is case-insensitive', () => {
    expect(getNotebookType('JUPYTER/NOTEBOOK:latest').label).toBe('Jupyter');
    expect(getNotebookType('CODESERVER-Python:v1').label).toBe('VS Code');
    expect(getNotebookType('RSTUDIO:latest').label).toBe('RStudio');
  });

  it('handles empty string', () => {
    expect(getNotebookType('').label).toBe('Custom');
  });
});

// ── getProfileStatus ───────────────────────────────────────────────────────────

describe('getProfileStatus', () => {
  it('returns Active when no conditions exist', () => {
    const result = getProfileStatus({ status: {} });
    expect(result.label).toBe('Active');
    expect(result.status).toBe('success');
    expect(result.icon).toBe('mdi:check-circle');
  });

  it('returns Active when status is empty', () => {
    const result = getProfileStatus({});
    expect(result.label).toBe('Active');
    expect(result.status).toBe('success');
  });

  it('returns Active when jsonData is null', () => {
    const result = getProfileStatus(null);
    expect(result.label).toBe('Active');
  });

  it('returns Ready when Ready condition is True', () => {
    const result = getProfileStatus({
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
      },
    });
    expect(result.label).toBe('Ready');
    expect(result.status).toBe('success');
    expect(result.icon).toBe('mdi:check-circle');
    expect(result.reason).toBeUndefined();
  });

  it('returns Not Ready when Ready condition is False', () => {
    const result = getProfileStatus({
      status: {
        conditions: [{ type: 'Ready', status: 'False', message: 'Namespace quota exceeded' }],
      },
    });
    expect(result.label).toBe('Not Ready');
    expect(result.status).toBe('error');
    expect(result.icon).toBe('mdi:alert-circle');
    expect(result.reason).toBe('Namespace quota exceeded');
  });

  it('returns Not Ready without reason when message is absent', () => {
    const result = getProfileStatus({
      status: {
        conditions: [{ type: 'Ready', status: 'False' }],
      },
    });
    expect(result.label).toBe('Not Ready');
    expect(result.reason).toBeUndefined();
  });

  it('returns last condition type when Ready condition is not found', () => {
    const result = getProfileStatus({
      status: {
        conditions: [
          { type: 'Initializing', status: 'True' },
          { type: 'Provisioning', status: 'True' },
        ],
      },
    });
    expect(result.label).toBe('Provisioning');
    expect(result.status).toBe('');
    expect(result.icon).toBe('mdi:clock-outline');
  });

  it('returns Unknown when last condition has no type', () => {
    const result = getProfileStatus({
      status: {
        conditions: [{ status: 'False' }],
      },
    });
    expect(result.label).toBe('Unknown');
  });
});

// ── Resource Calculation Helpers ───────────────────────────────────────────────

describe('parseCpuQuantity', () => {
  it('parses empty or undefined as 0', () => {
    expect(parseCpuQuantity(undefined)).toBe(0);
    expect(parseCpuQuantity('')).toBe(0);
  });

  it('parses milliCores (m) correctly', () => {
    expect(parseCpuQuantity('500m')).toBe(0.5);
    expect(parseCpuQuantity('100m')).toBe(0.1);
  });

  it('parses whole cores correctly', () => {
    expect(parseCpuQuantity('2')).toBe(2);
    expect(parseCpuQuantity('1.5')).toBe(1.5);
  });
});

describe('parseMemoryQuantity', () => {
  it('parses empty or undefined as 0', () => {
    expect(parseMemoryQuantity(undefined)).toBe(0);
    expect(parseMemoryQuantity('')).toBe(0);
  });

  it('parses unit-less values as bytes converting to GiB', () => {
    expect(parseMemoryQuantity('1073741824')).toBe(1); // 1024^3 bytes -> 1 Gi
  });

  it('parses Ki/Mi/Gi correctly', () => {
    expect(parseMemoryQuantity('1024Mi')).toBe(1);
    expect(parseMemoryQuantity('2Gi')).toBe(2);
    expect(parseMemoryQuantity('1048576Ki')).toBe(1);
  });

  it('parses base10 K/M/G correctly', () => {
    const rawG = 1000 ** 3;
    const gi = rawG / 1024 ** 3; // ~0.931
    expect(parseMemoryQuantity('1G')).toBeCloseTo(gi);
  });
});

describe('aggregateNotebookResources', () => {
  it('aggregates CPUs, memory, and GPUs across multiple notebooks', () => {
    const notebooks = [
      {
        jsonData: {
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    resources: {
                      requests: { cpu: '1', memory: '1Gi', 'nvidia.com/gpu': '1' },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  resources: {
                    requests: { cpu: '500m', memory: '512Mi' },
                    limits: { 'amd.com/gpu': '2' },
                  },
                },
              ],
            },
          },
        },
      },
    ];

    const result = aggregateNotebookResources(notebooks);
    expect(result.cpu).toBe(1.5);
    expect(result.memory).toBe(1.5);
    expect(result.gpu).toBe(3); // 1 from requests, 2 from limits
  });
});
