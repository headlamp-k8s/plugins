import { Icon } from '@iconify/react';
import {
  DateLabel,
  LabelListItem,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert, IconButton, Snackbar, Tooltip } from '@mui/material';
import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import { useState } from 'react';
import {
  ACMEChallengeSolver,
  ACMEIssuerStatus,
  IssuerReference,
  SecretKeySelector,
} from '../../resources/common';
import { Condition } from '../../resources/common';

interface CopyToClipboardProps {
  text: string;
  maxDisplayLength?: number;
}

export function CopyToClipboard({ text, maxDisplayLength = 30 }: CopyToClipboardProps) {
  const [showError, setShowError] = useState(false);
  const displayText =
    text.length > maxDisplayLength ? `${text.substring(0, maxDisplayLength)}...` : text;

  return (
    <>
      <div>
        <Tooltip title={text}>
          <span>{displayText}</span>
        </Tooltip>
        <IconButton
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
            } catch (error) {
              console.error('Failed to copy to clipboard:', error);
              setShowError(true);
            }
          }}
        >
          <Icon icon="mdi:content-copy" />
        </IconButton>
      </div>
      <Snackbar open={showError} autoHideDuration={6000} onClose={() => setShowError(false)}>
        <Alert onClose={() => setShowError(false)} severity="error">
          Failed to copy to clipboard
        </Alert>
      </Snackbar>
    </>
  );
}

interface IssuerRefProps {
  issuerRef: IssuerReference;
  namespace: string;
}

export function IssuerRef({ issuerRef, namespace }: IssuerRefProps) {
  return (
    <NameValueTable
      rows={[
        {
          name: 'Name',
          value: (
            <Link
              routeName={
                !issuerRef?.kind || issuerRef?.kind === 'Issuer'
                  ? '/cert-manager/issuers/:namespace/:name'
                  : '/cert-manager/clusterissuers/:name'
              }
              params={
                !issuerRef?.kind || issuerRef?.kind === 'Issuer'
                  ? {
                      name: issuerRef?.name,
                      namespace: namespace,
                    }
                  : { name: issuerRef?.name }
              }
            >
              {issuerRef?.name}
            </Link>
          ),
        },
        {
          name: 'Kind',
          value: issuerRef?.kind,
        },
      ]}
    />
  );
}

interface ConditionsTableProps {
  conditions: Condition[];
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  return (
    <SectionBox title="Conditions">
      <SimpleTable
        columns={[
          {
            label: 'Type',
            getter: item => item.type,
          },
          {
            label: 'Status',
            getter: item => item.status,
          },
          {
            label: 'Reason',
            getter: item => item.reason,
          },
          {
            label: 'Observed Generation',
            getter: item => item.observedGeneration,
          },
          {
            label: 'Message',
            getter: item => item.message,
          },
          {
            label: 'Last Transition Time',
            getter: item => <DateLabel date={item.lastTransitionTime} />,
            sort: (a, b) =>
              new Date(a.lastTransitionTime).getTime() - new Date(b.lastTransitionTime).getTime(),
          },
        ]}
        data={conditions}
      />
    </SectionBox>
  );
}

interface SecretKeySelectorProps {
  selector: SecretKeySelector;
}

export function SecretKeySelectorComponent({ selector }: SecretKeySelectorProps) {
  return (
    <NameValueTable
      rows={[
        {
          name: 'Name',
          value: selector.name,
        },
        {
          name: 'Key',
          value: selector.key,
        },
      ]}
    />
  );
}

interface ACMEChallengeSolverProps {
  solver: ACMEChallengeSolver;
}

export function ACMEChallengeSolverComponent({ solver }: ACMEChallengeSolverProps) {
  if (solver.http01) {
    const { podTemplate, ...otherIngressFields } = solver.http01.ingress || {};
    const data = {
      ...otherIngressFields,
      // Add podTemplate fields with proper prefixes
      ...(podTemplate?.spec?.nodeSelector && {
        'podTemplate.nodeSelector': JSON.stringify(podTemplate.spec.nodeSelector),
      }),
    };

    return (
      <SimpleTable
        columns={Object.keys(data).map(key => ({
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), // Add spaces before capitals
          getter: (item: any) => item[key]?.toString(),
        }))}
        data={[data]}
      />
    );
  }

  if (solver.dns01) {
    return (
      <SimpleTable
        columns={Object.keys(solver.dns01).map(key => ({
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), // Add spaces before capitals
          getter: (item: any) => item[key]?.toString(),
        }))}
        data={[solver.dns01]}
      />
    );
  }

  return null;
}

interface ACMEIssuerStatusProps {
  status: ACMEIssuerStatus;
}

export function ACMEIssuerStatusComponent({ status }: ACMEIssuerStatusProps) {
  return (
    <NameValueTable
      rows={[
        {
          name: 'URI',
          value: status.uri,
        },
        {
          name: 'Last Registered Email',
          value: status.lastRegisteredEmail,
        },
        {
          name: 'Last Private Key Hash',
          value: status.lastPrivateKeyHash,
        },
      ]}
    />
  );
}

interface StringArrayProps {
  items?: string[];
  emptyText?: string;
}

export function StringArray({ items, emptyText = 'None' }: StringArrayProps) {
  if (!items?.length) {
    return <span>{emptyText}</span>;
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <LabelListItem labels={[item]} />
        </div>
      ))}
    </div>
  );
}

interface NotInstalledBannerProps {
  isLoading?: boolean;
}

export function NotInstalledBanner({ isLoading = false }: NotInstalledBannerProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h5">
            cert-manager was not detected on your cluster. If you haven't already, please install
            it.
          </Typography>
        </Grid>
        <Grid item>
          <Typography>
            Learn how to{' '}
            <MuiLink
              href="https://cert-manager.io/docs/installation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              install
            </MuiLink>{' '}
            cert-manager
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
