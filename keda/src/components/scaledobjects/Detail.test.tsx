import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { scaledObject } = vi.hoisted(() => ({
  scaledObject: {
    metadata: { name: 'worker', namespace: 'default' },
    scaleTargetKind: 'Deployment',
    scaleTargetName: 'worker',
    jsonData: {},
    status: {},
    spec: {
      advanced: {
        horizontalPodAutoscalerConfig: {
          behavior: {
            scaleDown: {
              policies: [{ type: 'Pods', value: 1, periodSeconds: 60 }],
            },
            scaleUp: {
              policies: [
                { type: 'Pods', value: 4, periodSeconds: 15 },
                { type: 'Percent', value: 100, periodSeconds: 15 },
              ],
            },
          },
        },
        scalingModifiers: {},
      },
    },
  },
}));

type Row = { name: string; value?: ReactNode; hide?: boolean };

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Deployment: { kind: 'Deployment', useGet: () => [null] },
      StatefulSet: { kind: 'StatefulSet', useGet: () => [null] },
    },
  },
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ConditionsSection: () => null,
  DetailsGrid: (props: {
    extraSections: (item: unknown) => Array<{ id: string; section: ReactNode }>;
  }) => (
    <div>
      {props.extraSections(scaledObject).map(entry => (
        <div key={entry.id}>{entry.section}</div>
      ))}
    </div>
  ),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  NameValueTable: ({ rows }: { rows: Row[] }) => (
    <dl>
      {rows
        .filter(row => !row.hide)
        .map(row => (
          <div data-testid={`row-${row.name}`} key={row.name}>
            <dt>{row.name}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
    </dl>
  ),
  OwnedPodsSection: () => null,
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/deployment', () => ({ default: class {} }));
vi.mock('@kinvolk/headlamp-plugin/lib/k8s/statefulSet', () => ({ default: class {} }));

vi.mock('react-router-dom', () => ({ useParams: () => ({}) }));

vi.mock('../../resources/scaledobject', () => ({
  ScaledObject: { useGet: () => [scaledObject] },
  ScalingModifierMetricType: { AVERAGEVALUE: 'AverageValue', VALUE: 'Value' },
}));

vi.mock('../common/CommonComponents', () => ({
  KedaInstallCheck: ({ children }: { children: ReactNode }) => <>{children}</>,
  TriggersSection: () => null,
}));

vi.mock('../common/ScalingActions', () => ({
  hasPausedReplicas: () => false,
  isPaused: () => false,
  PausedReplicasAction: () => null,
  PauseScalingAction: () => null,
  ResumeScalingAction: () => null,
}));

import { ScaledObjectDetail } from './Detail';

describe('ScaledObjectDetail HPA behavior policies', () => {
  it('shows Pods policy values as a count and Percent values with %', () => {
    render(<ScaledObjectDetail namespace="default" name="worker" />);

    const values = screen
      .getAllByTestId('row-Value')
      .map(row => within(row).getByRole('definition').textContent);

    // Scale Down: Pods 1, then Scale Up: Pods 4 and Percent 100.
    expect(values).toEqual(['1', '4', '100%']);
  });
});
