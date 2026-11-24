import { render } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScaledObjectsList } from './List';

/** The props of Headlamp's `Link` that the test records. */
type LinkProps = {
  routeName: string;
  params: Record<string, string>;
  activeCluster?: string;
};

/** A column as the list hands it to Headlamp's ResourceListView. */
type Column = string | { render?: (item: unknown) => React.ReactNode };

const links = vi.hoisted(() => [] as LinkProps[]);
const rows = vi.hoisted(() => [] as unknown[]);

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Link: ({
    routeName,
    params,
    activeCluster,
    children,
  }: LinkProps & { children?: React.ReactNode }) => {
    links.push({ routeName, params, activeCluster });
    return <>{children}</>;
  },
  // Render every custom column for every row, the way the list view would.
  ResourceListView: ({ columns }: { columns: Column[] }) => (
    <>
      {rows.map((row, rowIndex) =>
        columns.map((column, colIndex) =>
          typeof column === 'string' ? null : (
            <span key={`${rowIndex}-${colIndex}`}>{column.render?.(row)}</span>
          )
        )
      )}
    </>
  ),
}));

vi.mock('../../resources/scaledobject', () => ({ ScaledObject: {} }));
vi.mock('../common/CommonComponents', () => ({
  KedaInstallCheck: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

/** A ScaledObject as a multi-cluster list returns it, tagged with its cluster. */
function scaledObject(cluster: string) {
  return {
    cluster,
    metadata: { name: 'web', namespace: 'default' },
    scaleTargetKind: 'Deployment',
    scaleTargetName: 'web',
    spec: {},
    status: {},
  };
}

describe('ScaledObjectsList', () => {
  beforeEach(() => {
    links.length = 0;
    rows.length = 0;
  });

  it('links the scale target to the cluster each row comes from', () => {
    rows.push(scaledObject('cluster-a'), scaledObject('cluster-b'));

    render(<ScaledObjectsList />);

    const targets = links.filter(link => link.routeName === 'Deployment');
    expect(targets.map(link => link.activeCluster)).toEqual(['cluster-a', 'cluster-b']);
  });
});
