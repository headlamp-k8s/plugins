import { Icon } from '@iconify/react';
import { clusterAction, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConfirmDialog,
  CreateResourceButton,
  DateLabel,
  DeleteButton,
  DownloadButton,
  EditButton,
  Link,
  Loader,
  SectionBox,
  SectionFilterHeader,
  Table,
  TableColumn,
  ViewButton,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, IconButton } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { useSelectedNamespaces } from '../../hooks/useSelectedNamespaces';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner, SecretNameLink } from '../common/CommonComponents';
import { CertificateExpiryLabel } from './CertificateExpiryLabel';

function DeleteSelectedCertificates({
  items,
  afterConfirm,
}: {
  items: Certificate[];
  afterConfirm: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('Delete items')}</Button>
      <ConfirmDialog
        open={open}
        title={t('Delete items')}
        description={
          <>
            {t('Are you sure you want to delete the following items?')}
            <ul>
              {items.map(item => (
                <li key={`${item.cluster}/${item.metadata.uid}`}>
                  {item.cluster}: {item.metadata.namespace}/{item.metadata.name}
                </li>
              ))}
            </ul>
          </>
        }
        handleClose={() => setOpen(false)}
        onConfirm={() => {
          clusterAction(() => Promise.all(items.map(item => item.delete())), {
            startMessage: t('Deleting certificates'),
            successMessage: t('Deleted certificates'),
            errorMessage: t('Failed to delete certificates'),
            cancelUrl: location.pathname,
            startUrl: location.pathname,
            errorUrl: location.pathname,
          });
          setOpen(false);
          afterConfirm();
        }}
      />
    </>
  );
}

export function CertificatesList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();
  return isManagerInstalled ? (
    <InstalledCertificatesList />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}

export interface CertificatesListViewProps {
  certificates: Certificate[] | null;
  certificatesError: ReturnType<typeof Certificate.useList>[1];
}

export function CertificatesListView({
  certificates,
  certificatesError,
}: CertificatesListViewProps) {
  const { t, ready } = useTranslation();
  const lastSelectedRow = useRef<string | null>(null);
  const columns = useMemo<TableColumn<Certificate>[]>(
    () => [
      {
        id: 'name',
        header: t('Name'),
        accessorFn: item => item.metadata.name,
        Cell: ({ row }) => <Link kubeObject={row.original} />,
      },
      {
        id: 'namespace',
        header: t('Namespace'),
        accessorFn: item => item.metadata.namespace,
        filterVariant: 'multi-select',
        Cell: ({ row: { original: item } }) => (
          <Link
            routeName="namespace"
            params={{ name: item.metadata.namespace }}
            activeCluster={item.cluster}
          >
            {item.metadata.namespace}
          </Link>
        ),
      },
      { id: 'cluster', header: t('Cluster'), accessorFn: item => item.cluster },
      {
        id: 'ready',
        header: t('Ready'),
        accessorFn: item => (item.ready ? t('Ready') : t('Not Ready')),
      },
      {
        id: 'secret',
        header: t('Secret'),
        accessorFn: item => item.spec.secretName,
        Cell: ({ row: { original: item } }) => (
          <SecretNameLink
            name={item.spec.secretName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'expiresIn',
        header: t('Expires In'),
        accessorFn: item => {
          const value = Date.parse(item.status?.notAfter || '');
          return Number.isNaN(value) ? undefined : value;
        },
        sortingFn: 'basic',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ row }) => <CertificateExpiryLabel notAfter={row.original.status?.notAfter} />,
      },
      {
        id: 'age',
        header: t('Age'),
        accessorFn: item => -Date.parse(item.metadata.creationTimestamp),
        enableColumnFilter: false,
        Cell: ({ row }) => <DateLabel date={row.original.metadata.creationTimestamp} />,
      },
    ],
    [t]
  );

  // Headlamp memoizes table cells, so mount only once translated values exist.
  if (!ready) {
    return <Loader title={t('Loading certificates') || 'Loading certificates'} />;
  }

  return (
    <SectionBox
      title={
        <SectionFilterHeader
          title={t('Certificates')}
          titleSideActions={[<CreateResourceButton key="create" resourceClass={Certificate} />]}
        />
      }
    >
      <Table
        columns={columns}
        data={certificates ?? []}
        loading={certificates === null && !certificatesError}
        errorMessage={certificatesError ? t('Failed to load certificates') : undefined}
        initialState={{ sorting: [{ id: 'expiresIn', desc: false }] }}
        getRowId={item =>
          `${item.cluster}/${
            item.metadata.uid || `${item.metadata.namespace}/${item.metadata.name}`
          }`
        }
        enableRowActions
        enableRowSelection={import.meta.env.REACT_APP_HEADLAMP_ENABLE_ROW_SELECTION !== 'false'}
        displayColumnDefOptions={{
          'mrt-row-select': {
            Cell: ({ row, table }) => (
              <IconButton
                role="checkbox"
                aria-checked={row.getIsSelected()}
                aria-label={t('Toggle select row')}
                disabled={!row.getCanSelect()}
                size="small"
                color={row.getIsSelected() ? 'primary' : 'default'}
                sx={{ padding: 0 }}
                onClick={event => {
                  // A button avoids Headlamp's capture handler cancelling native
                  // checkbox state. Retain shift-click selection in visible order.
                  const rows = table.getRowModel().rows;
                  const start = rows.findIndex(item => item.id === lastSelectedRow.current);
                  const end = rows.findIndex(item => item.id === row.id);
                  if (event.shiftKey && start !== -1 && end !== -1) {
                    const selected = Object.fromEntries(
                      rows
                        .slice(Math.min(start, end), Math.max(start, end) + 1)
                        .filter(item => item.getCanSelect())
                        .map(item => [item.id, true])
                    );
                    table.setRowSelection(previous => ({ ...previous, ...selected }));
                  } else {
                    row.toggleSelected();
                    lastSelectedRow.current = row.id;
                  }
                }}
              >
                <Icon
                  icon={row.getIsSelected() ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'}
                  width={20}
                />
              </IconButton>
            ),
          },
        }}
        renderRowActionMenuItems={({ row, closeMenu }) => [
          <EditButton key="edit" item={row.original} buttonStyle="menu" afterConfirm={closeMenu} />,
          <DownloadButton key="download" item={row.original} buttonStyle="menu" />,
          <ViewButton key="view" item={row.original} buttonStyle="menu" />,
          <DeleteButton
            key="delete"
            item={row.original}
            buttonStyle="menu"
            afterConfirm={closeMenu}
          />,
        ]}
        renderRowSelectionToolbar={({ table }) => (
          <DeleteSelectedCertificates
            items={table.getSelectedRowModel().rows.map(row => row.original)}
            afterConfirm={() => table.resetRowSelection()}
          />
        )}
      />
    </SectionBox>
  );
}

function InstalledCertificatesList() {
  const selectedNamespaces = useSelectedNamespaces();
  const [certificates, certificatesError] = Certificate.useList({ namespace: selectedNamespaces });
  return <CertificatesListView certificates={certificates} certificatesError={certificatesError} />;
}
