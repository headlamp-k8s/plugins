import { lightTheme } from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Certificate } from '../../resources/certificate';
import { CertificatesList } from './List';

const mocks = vi.hoisted(() => ({
  useList: vi.fn(),
  installed: true as boolean | null,
  translationsReady: true,
  clusterAction: vi.fn(),
  t: (key: string, options?: { count?: number }) =>
    key.replace('{{count}}', String(options?.count)),
}));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: mocks.translationsReady ? mocks.t : () => '',
    ready: mocks.translationsReady,
  }),
  clusterAction: mocks.clusterAction,
  K8s: { ResourceClasses: { Secret: { kind: 'Secret' } } },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t, i18n: { language: 'en' } }),
  Trans: ({ children }: any) => children,
}));
vi.mock('../../resources/certificate', () => ({
  Certificate: { useList: mocks.useList, detailsRoute: 'certificate' },
}));
vi.mock('../../hooks/useCertManagerInstalled', () => ({
  useCertManagerInstalled: () => ({
    isManagerInstalled: mocks.installed,
    isCertManagerCheckLoading: mocks.installed === null,
  }),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/components/App/Settings/hook', () => ({
  useSettings: () => [15, 25, 50],
}));
vi.mock('@kinvolk/headlamp-plugin/lib/lib/useShortcut', () => ({ useShortcut: () => {} }));
vi.mock('@kinvolk/headlamp-plugin/lib/lib/util', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return { useURLState: (_key: string, value: any) => React.useState(value.defaultValue ?? value) };
});

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', async () => {
  // Exercise Headlamp's real table and Material React Table, not a reimplementation.
  const { default: Table } = await vi.importActual<any>(
    '@kinvolk/headlamp-plugin/lib/components/common/Table/Table'
  );
  return {
    Table,
    Loader: ({ title }: any) => <div role="progressbar">{title}</div>,
    SectionBox: ({ title, children }: any) => (
      <section>
        {title}
        {children}
      </section>
    ),
    SectionFilterHeader: ({ title, titleSideActions }: any) => (
      <header>
        <h1>{title}</h1>
        <span>Namespace filter</span>
        {titleSideActions}
      </header>
    ),
    CreateResourceButton: () => <button>Create certificate</button>,
    DateLabel: ({ date }: any) => <span>{date}</span>,
    Link: ({ kubeObject, children, activeCluster, params }: any) => (
      <a
        href={`/${activeCluster || kubeObject?.cluster}/${params?.namespace || ''}/${
          params?.name || kubeObject?.metadata.name
        }`}
      >
        {children || kubeObject?.metadata.name}
      </a>
    ),
    EditButton: () => <button>Edit certificate</button>,
    DeleteButton: () => <button>Delete certificate</button>,
    DownloadButton: () => <button>Download certificate</button>,
    ViewButton: () => <button>View certificate</button>,
    ConfirmDialog: ({ open, description, handleClose, onConfirm }: any) =>
      open ? (
        <div role="dialog">
          {description}
          <button onClick={handleClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      ) : null,
  };
});
// CommonComponents.tsx and the label use this equivalent public export path.
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', async () => ({
  ...(await vi.importMock<any>('@kinvolk/headlamp-plugin/lib/CommonComponents')),
  StatusLabel: ({ children }: any) => <span>{children}</span>,
}));

function certificate(
  name: string,
  notAfter: string | undefined,
  created: string,
  cluster = 'cluster-b'
) {
  return {
    metadata: { name, namespace: 'production', creationTimestamp: created, uid: name },
    cluster,
    spec: { secretName: `${name}-tls` },
    status: { notAfter },
    ready: true,
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as Certificate;
}
let certificates: Certificate[];
function renderList(namespaces = new Set<string>()) {
  const store = configureStore({
    reducer: (state = { filter: { namespaces } }, action) =>
      action.type === 'select'
        ? { filter: { namespaces: new Set(action.payload as string[]) } }
        : state,
    middleware: getDefault => getDefault({ serializableCheck: false }),
  });
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={createMuiTheme(lightTheme)}>
          <CertificatesList />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
  return { ...view, store };
}
function displayedNames() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('link')[0].textContent);
}
beforeEach(() => {
  mocks.installed = true;
  mocks.translationsReady = true;
  mocks.useList.mockReset();
  mocks.clusterAction.mockReset();
  certificates = [
    certificate('healthy', '2030-12-01', '2026-10-03'),
    certificate('unknown', undefined, '2026-10-02'),
    certificate('invalid', 'bad-date', '2026-10-04'),
    certificate('urgent', '2030-01-01', '2026-10-01'),
  ];
  mocks.useList.mockReturnValue([certificates, null]);
});
afterEach(cleanup);

describe('CertificatesList with the Headlamp table', () => {
  it('waits for translations before mounting cached table headers and Ready values', () => {
    mocks.translationsReady = false;
    const { store } = renderList();
    expect(screen.queryByRole('table')).toBeNull();
    mocks.translationsReady = true;
    act(() => {
      store.dispatch({ type: 'select', payload: ['production'] });
    });
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Expires In')).toBeTruthy();
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(1);
  });
  it('keeps checkbox state in sync with individual, range, and cleared selection', () => {
    renderList();
    const checked = (element: HTMLElement) =>
      element instanceof HTMLInputElement
        ? element.checked
        : element.getAttribute('aria-checked') === 'true';
    const rowCheckboxes = () => screen.getAllByRole('checkbox').slice(1);
    fireEvent.click(rowCheckboxes()[0]);
    expect(checked(rowCheckboxes()[0])).toBe(true);
    fireEvent.click(rowCheckboxes()[2], { shiftKey: true });
    expect(rowCheckboxes().map(checked)).toEqual([true, true, true, false]);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(rowCheckboxes().map(checked)).toEqual([false, false, false, false]);
  });
  it('sorts valid expiry dates both ways, keeps unknowns last, and retains name and age sorting', () => {
    renderList();
    expect(displayedNames()).toEqual(['urgent', 'healthy', 'unknown', 'invalid']);
    fireEvent.click(screen.getByText('Expires In'));
    expect(displayedNames()).toEqual(['healthy', 'urgent', 'unknown', 'invalid']);
    fireEvent.click(screen.getByText('Name'));
    expect(displayedNames()).toEqual(['healthy', 'invalid', 'unknown', 'urgent']);
    fireEvent.click(screen.getByText('Age'));
    expect(displayedNames()).not.toEqual(['healthy', 'invalid', 'unknown', 'urgent']);
    fireEvent.click(screen.getByText('Expires In'));
    expect(displayedNames()).toEqual(['urgent', 'healthy', 'unknown', 'invalid']);
  });
  it('reacts to namespace selection and preserves create and resource actions', () => {
    const { store } = renderList(new Set(['production']));
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: ['production'] });
    expect(screen.getByRole('button', { name: 'Create certificate' })).toBeTruthy();
    expect(screen.getByText('Namespace filter')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /Row Actions/i })[0]);
    for (const name of [
      'Edit certificate',
      'Delete certificate',
      'Download certificate',
      'View certificate',
    ])
      expect(screen.getByRole('button', { name })).toBeTruthy();
    act(() => {
      store.dispatch({ type: 'select', payload: ['security'] });
    });
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: ['security'] });
    act(() => {
      store.dispatch({ type: 'select', payload: [] });
    });
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: undefined });
  });
  it('requests all allowed namespaces with an initially empty selection', () => {
    renderList();
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: undefined });
  });
  it('keeps Secret links in the certificate cluster', () => {
    renderList();
    expect(screen.getByRole('link', { name: 'urgent-tls' }).getAttribute('href')).toBe(
      '/cluster-b/production/urgent-tls'
    );
  });
  it('requires confirmation for bulk deletion and dispatches the selected resources only', async () => {
    renderList();
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete items' }));
    expect(mocks.clusterAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.clusterAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete items' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mocks.clusterAction).toHaveBeenCalledTimes(1);
    await mocks.clusterAction.mock.calls[0][0]();
    expect(
      certificates.find(item => item.metadata.name === 'urgent')!.delete
    ).toHaveBeenCalledTimes(1);
    for (const item of certificates.filter(item => item.metadata.name !== 'urgent'))
      expect(item.delete).not.toHaveBeenCalled();
  });
  it('shows an explicit error on list failures', () => {
    mocks.useList.mockReturnValue([null, new Error('Forbidden')]);
    renderList();
    expect(screen.getByText('Failed to load certificates')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
  it.each([null, false])('does not fetch certificates when installation is %s', installed => {
    mocks.installed = installed;
    renderList();
    expect(mocks.useList).not.toHaveBeenCalled();
  });
});
