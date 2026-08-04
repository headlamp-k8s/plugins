/**
 * @vitest-environment jsdom
 */
import { vi } from 'vitest';
vi.hoisted(() => {
  globalThis.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  } as any;
});

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class {
    jsonData: any;
    constructor(json: any) { this.jsonData = json; }
    getName() { return this.jsonData.metadata.name; }
    getNamespace() { return this.jsonData.metadata.namespace; }
  }
}));

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BackupList } from './BackupList';

// Mock the ResourceListView component
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: (props: any) => (
    <div data-testid="resource-list-view">
      <h1>{props.title}</h1>
      <span data-testid="columns">{props.columns.map((c: any) => (typeof c === 'string' ? c : c.id)).join(',')}</span>
    </div>
  ),
}));

describe('BackupList', () => {
  it('renders a ResourceListView with correct title and columns', () => {
    render(<BackupList />);

    expect(screen.getByTestId('resource-list-view')).toBeInTheDocument();
    expect(screen.getByText('Backups')).toBeInTheDocument();
    expect(screen.getByTestId('columns')).toHaveTextContent('name,namespace,phase,storageLocation,age');
  });
});
