import { render } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Table from './Table';

/** The props of Headlamp's `Link` that the test records. */
type LinkProps = {
  routeName: string;
  params: Record<string, string>;
  activeCluster?: string;
};

/** A column as the shared table hands it to Headlamp's table. */
type Column = {
  Cell?: (props: { row: { original: unknown } }) => React.ReactNode;
};

const links = vi.hoisted(() => [] as LinkProps[]);

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
  DateLabel: () => null,
  ShowHideLabel: () => null,
  // Render every Cell for every row, the way Headlamp's table would.
  Table: ({ data, columns }: { data: unknown[]; columns: Column[] }) => (
    <>
      {data.map((row, rowIndex) =>
        columns.map((column, colIndex) => (
          <span key={`${rowIndex}-${colIndex}`}>{column.Cell?.({ row: { original: row } })}</span>
        ))
      )}
    </>
  ),
}));

// The real helpers module pulls in the whole Headlamp k8s layer; the table only
// needs the source reference of a row.
vi.mock('../helpers', () => ({
  getSourceNameAndPluralKind: (item: { jsonData: { spec: { sourceRef: { name: string } } } }) => ({
    name: item.jsonData.spec.sourceRef.name,
    pluralKind: 'gitrepositories',
    namespace: undefined,
  }),
}));

/** A Kustomization as a multi-cluster list returns it, tagged with its cluster. */
function kustomization(cluster: string) {
  const jsonData = {
    kind: 'Kustomization',
    metadata: { name: 'apps', namespace: 'flux-system' },
    spec: { sourceRef: { kind: 'GitRepository', name: 'repo' } },
  };
  return { cluster, kind: 'Kustomization', jsonData, metadata: jsonData.metadata };
}

describe('Table', () => {
  beforeEach(() => {
    links.length = 0;
  });

  it('links name, namespace and source to the cluster each row comes from', () => {
    render(
      <Table
        data={[kustomization('cluster-a'), kustomization('cluster-b')]}
        columns={[{ extends: 'name', routeName: 'kustomization' }, 'namespace', 'source']}
      />
    );

    const clustersByRoute = (routeName: string) =>
      links.filter(link => link.routeName === routeName).map(link => link.activeCluster);

    expect(clustersByRoute('kustomization')).toEqual(['cluster-a', 'cluster-b']);
    expect(clustersByRoute('namespace')).toEqual(['cluster-a', 'cluster-b']);
    expect(clustersByRoute('source')).toEqual(['cluster-a', 'cluster-b']);
  });
});
