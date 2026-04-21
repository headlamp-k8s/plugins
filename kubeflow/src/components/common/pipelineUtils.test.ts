/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  countPipelineVersionsForPipeline,
  getLatestPipelineVersionForPipeline,
  getPipelineDetailsPath,
  getPipelineExperimentDetailsPath,
  getPipelineRecurringRunDetailsPath,
  getPipelineResourceStatus,
  getPipelineRunDetailsPath,
  getPipelineRunDurationLabel,
  getPipelineRunDurationMs,
  getPipelineRunRoot,
  getPipelineVersionDetailsPath,
  getPipelineVersionsForPipeline,
  getRecurringRunSchedule,
  hasPipelineVersionSource,
} from './pipelineUtils';

describe('getPipelineResourceStatus', () => {
  it('returns Failed when a failed condition is true', () => {
    const result = getPipelineResourceStatus({
      status: {
        conditions: [{ type: 'Failed', status: 'True', reason: 'ValidationError' }],
      },
    });

    expect(result.label).toBe('Failed');
    expect(result.status).toBe('error');
    expect(result.reason).toBe('ValidationError');
  });

  it('returns Ready when a ready condition is true', () => {
    const result = getPipelineResourceStatus({
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
      },
    });

    expect(result.label).toBe('Ready');
    expect(result.status).toBe('success');
  });

  it('falls back to phase when no matching condition exists', () => {
    const result = getPipelineResourceStatus({
      status: {
        phase: 'Succeeded',
        conditions: [{ type: 'Scheduled', status: 'False' }],
      },
    });

    expect(result.label).toBe('Succeeded');
    expect(result.status).toBe('success');
  });

  it('returns the latest true condition when phase is absent', () => {
    const result = getPipelineResourceStatus({
      status: {
        conditions: [
          { type: 'Scheduled', status: 'False' },
          { type: 'Uploaded', status: 'True', message: 'Stored in object store' },
        ],
      },
    });

    expect(result.label).toBe('Uploaded');
    expect(result.reason).toBe('Stored in object store');
  });

  it('returns Pending when status is missing', () => {
    const result = getPipelineResourceStatus(undefined);

    expect(result.label).toBe('Pending');
    expect(result.status).toBe('');
  });
});

describe('countPipelineVersionsForPipeline', () => {
  it('counts only versions that match both pipeline name and namespace', () => {
    const count = countPipelineVersionsForPipeline(
      [
        { metadata: { namespace: 'team-a' }, pipelineName: 'demo' },
        { metadata: { namespace: 'team-a' }, pipelineName: 'demo' },
        { metadata: { namespace: 'team-b' }, pipelineName: 'demo' },
        { metadata: { namespace: 'team-a' }, pipelineName: 'other' },
      ],
      'demo',
      'team-a'
    );

    expect(count).toBe(2);
  });

  it('returns zero when the pipeline name is empty', () => {
    const count = countPipelineVersionsForPipeline(
      [{ metadata: { namespace: 'team-a' }, pipelineName: 'demo' }],
      '',
      'team-a'
    );

    expect(count).toBe(0);
  });
});

describe('pipeline route helpers', () => {
  it('builds a Pipeline detail path', () => {
    expect(getPipelineDetailsPath()).toBe('kubeflow-pipelines-detail');
  });

  it('builds a PipelineVersion detail path', () => {
    expect(getPipelineVersionDetailsPath()).toBe('kubeflow-pipeline-versions-detail');
  });

  it('builds a Pipeline Run detail path', () => {
    expect(getPipelineRunDetailsPath()).toBe('kubeflow-pipeline-runs-detail');
  });

  it('builds a Recurring Run detail path', () => {
    expect(getPipelineRecurringRunDetailsPath()).toBe('kubeflow-pipeline-recurring-detail');
  });

  it('builds an Experiment detail path', () => {
    expect(getPipelineExperimentDetailsPath()).toBe('kubeflow-pipeline-experiments-detail');
  });
});

describe('getPipelineVersionsForPipeline', () => {
  it('returns only versions for the given pipeline and namespace', () => {
    const versions = getPipelineVersionsForPipeline(
      [
        { metadata: { name: 'v1', namespace: 'default' }, pipelineName: 'demo' },
        { metadata: { name: 'v2', namespace: 'default' }, pipelineName: 'demo' },
        { metadata: { name: 'v3', namespace: 'other' }, pipelineName: 'demo' },
        { metadata: { name: 'v4', namespace: 'default' }, pipelineName: 'other' },
      ],
      'demo',
      'default'
    );

    expect(versions).toHaveLength(2);
    expect(versions.map(version => version.metadata?.name)).toEqual(['v1', 'v2']);
  });
});

describe('getLatestPipelineVersionForPipeline', () => {
  it('returns the newest related version', () => {
    const latestVersion = getLatestPipelineVersionForPipeline(
      [
        {
          metadata: {
            name: 'v1',
            namespace: 'default',
            creationTimestamp: '2026-04-11T17:22:54Z',
          },
          pipelineName: 'demo',
        },
        {
          metadata: {
            name: 'v2',
            namespace: 'default',
            creationTimestamp: '2026-04-11T17:23:54Z',
          },
          pipelineName: 'demo',
        },
      ],
      'demo',
      'default'
    );

    expect(latestVersion?.metadata?.name).toBe('v2');
  });

  it('returns null when no versions exist', () => {
    expect(getLatestPipelineVersionForPipeline([], 'demo', 'default')).toBeNull();
  });
});

describe('hasPipelineVersionSource', () => {
  it('returns false when no source fields are present', () => {
    expect(hasPipelineVersionSource({ spec: {} })).toBe(false);
  });

  it('returns true when a source field exists', () => {
    expect(
      hasPipelineVersionSource({
        spec: { pipelineSpecURI: 'https://example.com/pipeline.yaml' },
      })
    ).toBe(true);
  });
});

describe('getPipelineRunRoot', () => {
  it('returns pipeline root from runtimeConfig when present', () => {
    expect(
      getPipelineRunRoot({ spec: { runtimeConfig: { pipelineRoot: 's3://bucket/root' } } })
    ).toBe('s3://bucket/root');
  });

  it('falls back to pipelineRoot field', () => {
    expect(getPipelineRunRoot({ spec: { pipelineRoot: 'gs://root' } })).toBe('gs://root');
  });
});

describe('getPipelineRunDurationMs', () => {
  it('returns duration between start and completion time', () => {
    const duration = getPipelineRunDurationMs({
      status: {
        startTime: '2026-04-11T10:00:00Z',
        completionTime: '2026-04-11T10:05:00Z',
      },
    });

    expect(duration).toBe(5 * 60 * 1000);
  });

  it('returns 0 when timestamps are missing', () => {
    expect(getPipelineRunDurationMs({ status: {} })).toBe(0);
  });
});

describe('getPipelineRunDurationLabel', () => {
  it('returns a formatted duration label', () => {
    const label = getPipelineRunDurationLabel({
      status: {
        startTime: '2026-04-11T10:00:00Z',
        completionTime: '2026-04-11T10:01:00Z',
      },
    });

    expect(label).toMatch(/1m|60s/);
  });

  it('returns dash when duration cannot be computed', () => {
    expect(getPipelineRunDurationLabel({ status: {} })).toBe('-');
  });
});

describe('getRecurringRunSchedule', () => {
  it('prefers cron schedule', () => {
    expect(getRecurringRunSchedule({ spec: { cronSchedule: '0 0 * * *' } })).toBe('0 0 * * *');
  });

  it('formats interval schedule', () => {
    expect(getRecurringRunSchedule({ spec: { intervalSecond: 3600 } })).toBe('Every 1h');
  });
});
