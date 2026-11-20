import { Icon } from '@iconify/react';
import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
import { Trans } from 'react-i18next';
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
  const { t } = useTranslation();
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
          aria-label={t('Copy to clipboard')}
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
          {t('Failed to copy to clipboard')}
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
  const { t } = useTranslation();
  return (
    <NameValueTable
      rows={[
        {
          name: t('Name'),
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
          name: t('Kind'),
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
  const { t } = useTranslation();
  return (
    <SectionBox title={t('Conditions')}>
      <SimpleTable
        columns={[
          {
            label: t('Type'),
            getter: item => item.type,
          },
          {
            label: t('Status'),
            getter: item => item.status,
          },
          {
            label: t('Reason'),
            getter: item => item.reason,
          },
          {
            label: t('Observed Generation'),
            getter: item => item.observedGeneration,
          },
          {
            label: t('Message'),
            getter: item => item.message,
          },
          {
            label: t('Last Transition Time'),
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
  namespace?: string;
}

export function SecretKeySelectorComponent({ selector, namespace }: SecretKeySelectorProps) {
  const { t } = useTranslation();
  return (
    <NameValueTable
      rows={[
        {
          name: t('Name'),
          value: namespace ? (
            <Link
              routeName={K8s.ResourceClasses.Secret.kind}
              params={{ name: selector.name, namespace }}
            >
              {selector.name}
            </Link>
          ) : (
            selector.name
          ),
        },
        {
          name: t('Key'),
          value: selector.key,
        },
      ]}
    />
  );
}

// Turns a solver field name such as "hostedZoneID" into a column or row label ("Hosted Zone ID").
function formatSolverFieldName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

// cert-manager names references to a key in a Secret "...SecretRef" ({ name, key }).
function isSecretKeySelector(name: string, value: object): value is SecretKeySelector {
  return name.endsWith('SecretRef') && typeof (value as { name?: unknown }).name === 'string';
}

interface SolverFieldValueProps {
  name: string;
  value: unknown;
  namespace?: string;
}

/**
 * Shows any value of an ACME solver: scalars as text, Secret key references like
 * the Secret rows elsewhere, and nested objects and lists as tables. Solvers have many
 * providers (route53, azureDNS, webhook, ...), each with its own nested fields.
 */
function SolverFieldValue({ name, value, namespace }: SolverFieldValueProps) {
  const { t } = useTranslation();
  // A Map, so arbitrary keys from user config (such as "__proto__" or "constructor")
  // cannot pick up inherited object properties as labels.
  const labels = new Map<string, string>([
    ['email', t('Email')],
    ['apiKeySecretRef', t('API Key Secret')],
    ['apiTokenSecretRef', t('API Token Secret')],
  ]);

  if (value === null || value === undefined || value === '') {
    return <>-</>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <>-</>;
    }
    return (
      <>
        {value.map((entry, index) => (
          <Box key={index} mb={index < value.length - 1 ? 1 : 0}>
            <SolverFieldValue name={name} value={entry} namespace={namespace} />
          </Box>
        ))}
      </>
    );
  }

  if (typeof value === 'object') {
    if (isSecretKeySelector(name, value)) {
      return <SecretKeySelectorComponent selector={value} namespace={namespace} />;
    }

    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <>-</>;
    }
    return (
      <NameValueTable
        rows={entries.map(([key, entryValue]) => ({
          name: labels.get(key) ?? formatSolverFieldName(key),
          value: <SolverFieldValue name={key} value={entryValue} namespace={namespace} />,
        }))}
      />
    );
  }

  return <>{String(value)}</>;
}

interface ACMEChallengeSolverProps {
  solver: ACMEChallengeSolver;
  namespace?: string;
}

export function ACMEChallengeSolverComponent({ solver, namespace }: ACMEChallengeSolverProps) {
  function solverTable(data: { [key: string]: unknown }) {
    return (
      <SimpleTable
        columns={Object.keys(data).map(key => ({
          label: formatSolverFieldName(key),
          getter: (item: { [key: string]: unknown }) => (
            <SolverFieldValue name={key} value={item[key]} namespace={namespace} />
          ),
        }))}
        data={[data]}
      />
    );
  }

  if (solver.http01) {
    // An HTTP-01 solver uses either an Ingress or a Gateway API HTTPRoute.
    const { podTemplate, ...otherFields } =
      solver.http01.ingress || solver.http01.gatewayHTTPRoute || {};
    return solverTable({
      ...otherFields,
      // Add podTemplate fields with proper prefixes
      ...(podTemplate?.spec?.nodeSelector && {
        'podTemplate.nodeSelector': JSON.stringify(podTemplate.spec.nodeSelector),
      }),
    });
  }

  if (solver.dns01) {
    return solverTable(solver.dns01);
  }

  return null;
}

interface ACMEIssuerStatusProps {
  status: ACMEIssuerStatus;
}

export function ACMEIssuerStatusComponent({ status }: ACMEIssuerStatusProps) {
  const { t } = useTranslation();
  return (
    <NameValueTable
      rows={[
        {
          name: t('URI'),
          value: status.uri,
        },
        {
          name: t('Last Registered Email'),
          value: status.lastRegisteredEmail,
        },
        {
          name: t('Last Private Key Hash'),
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

export function StringArray({ items, emptyText }: StringArrayProps) {
  const { t } = useTranslation();
  if (!items?.length) {
    return <span>{emptyText ?? t('None')}</span>;
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
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress aria-label={t('Checking cert-manager installation status')} />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h5">
            {t(
              "cert-manager was not detected on your cluster. If you haven't already, please install it."
            )}
          </Typography>
        </Grid>
        <Grid item>
          <Typography>
            {/* Keep the sentence in one i18n unit so translators can position the link
                anywhere in the translated string. <2> matches the MuiLink child. */}
            <Trans>
              Learn how to{' '}
              <MuiLink
                href="https://cert-manager.io/docs/installation/"
                target="_blank"
                rel="noopener noreferrer"
              >
                install
              </MuiLink>{' '}
              cert-manager
            </Trans>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
