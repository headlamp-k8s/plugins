import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KafkaConnector } from '../../resources/kafkaConnector';
import { isSecretLikeKey } from '../../utils/secretKeys';

const MASK = '••••••••';

/**
 * Render one row of the connector configuration table. Keys that look
 * like they could carry a credential are masked by default and gated
 * behind a per-page confirmation; everything else is shown plainly.
 */
function ConfigValue({
  configKey,
  value,
  revealed,
  acknowledged,
  onRequestReveal,
  onHide,
}: {
  configKey: string;
  value: string;
  revealed: boolean;
  acknowledged: boolean;
  onRequestReveal: (key: string) => void;
  onHide: (key: string) => void;
}) {
  const isSecret = isSecretLikeKey(configKey);

  if (!isSecret) {
    return <span>{value}</span>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box
        component="span"
        sx={{
          fontFamily: revealed ? 'monospace' : 'inherit',
          overflowWrap: 'anywhere',
          flex: '1 1 auto',
        }}
      >
        {revealed ? value : MASK}
      </Box>
      <Button
        size="small"
        variant="text"
        onClick={() => (revealed ? onHide(configKey) : onRequestReveal(configKey))}
        aria-label={
          revealed
            ? `Hide value of ${configKey}`
            : `Reveal value of ${configKey}${acknowledged ? '' : ' (will prompt for confirmation)'}`
        }
        sx={{ flex: '0 0 auto' }}
      >
        {revealed ? 'Hide' : 'Show'}
      </Button>
    </Box>
  );
}

/**
 * Detail page for a `KafkaConnector` resource.
 *
 * Surfaces the connector's spec (class, tasks, desired state), the
 * Kafka Connect runtime view (`status.connectorStatus`), the connector
 * config as a name/value table (with credential-like values masked
 * behind an explicit reveal), and the standard conditions section.
 */
export function KafkaConnectorDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  const [acknowledged, setAcknowledged] = React.useState(false);
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);

  const requestReveal = (key: string) => {
    if (acknowledged) {
      setRevealed(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    } else {
      setPendingKey(key);
    }
  };

  const hideKey = (key: string) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const confirmReveal = () => {
    if (pendingKey != null) {
      setAcknowledged(true);
      setRevealed(prev => {
        const next = new Set(prev);
        next.add(pendingKey);
        return next;
      });
    }
    setPendingKey(null);
  };

  return (
    <>
      <DetailsGrid
        resourceType={KafkaConnector}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item
            ? [
                { name: 'Class', value: item.connectorClass || '-' },
                { name: 'Connect cluster', value: item.connectClusterName || '-' },
                { name: 'Tasks max', value: item.tasksMax ?? '-' },
                { name: 'Desired state', value: item.desiredState },
                { name: 'Runtime state', value: item.runtimeState ?? '-' },
                { name: 'Status', value: String(item.readyStatus ?? 'Unknown') },
              ]
            : []
        }
        extraSections={item =>
          item
            ? [
                {
                  id: 'config',
                  section: (
                    <SectionBox title="Connector configuration">
                      <NameValueTable
                        rows={Object.entries(item.spec?.config ?? {}).map(([key, value]) => {
                          const valueStr =
                            typeof value === 'string' ? value : JSON.stringify(value);
                          return {
                            name: key,
                            value: (
                              <ConfigValue
                                configKey={key}
                                value={valueStr}
                                revealed={revealed.has(key)}
                                acknowledged={acknowledged}
                                onRequestReveal={requestReveal}
                                onHide={hideKey}
                              />
                            ),
                          };
                        })}
                      />
                    </SectionBox>
                  ),
                },
                {
                  id: 'tasks',
                  section: (
                    <SectionBox title="Tasks">
                      <SimpleTable
                        columns={[
                          { label: 'ID', getter: row => row.id ?? '-' },
                          { label: 'State', getter: row => row.state ?? '-' },
                          { label: 'Worker', getter: row => row.worker_id ?? '-' },
                        ]}
                        data={item.status?.connectorStatus?.tasks ?? []}
                        emptyMessage="No tasks reported by Kafka Connect yet."
                      />
                    </SectionBox>
                  ),
                },
                {
                  id: 'topics',
                  section: (
                    <SectionBox title="Topics">
                      <NameValueTable
                        rows={[
                          {
                            name: 'Topics',
                            value: (item.status?.topics ?? []).join(', ') || '-',
                          },
                        ]}
                      />
                    </SectionBox>
                  ),
                },
                {
                  id: 'conditions',
                  section: <ConditionsSection resource={item?.jsonData} />,
                },
              ]
            : []
        }
      />
      <Dialog
        open={pendingKey !== null}
        onClose={() => setPendingKey(null)}
        aria-labelledby="connector-config-reveal-title"
        aria-describedby="connector-config-reveal-description"
      >
        <DialogTitle id="connector-config-reveal-title">Reveal sensitive value?</DialogTitle>
        <DialogContent>
          <DialogContentText id="connector-config-reveal-description">
            <Box component="span" sx={{ display: 'block', mb: 1 }}>
              The value of <strong>{pendingKey}</strong> may contain credentials
              (passwords, tokens, API keys). Show it on this page anyway?
            </Box>
            <Box component="span" sx={{ display: 'block', fontSize: 13 }}>
              Once acknowledged, other masked values on this page can be revealed
              without re-prompting. Navigate away to reset.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingKey(null)}>Cancel</Button>
          <Button onClick={confirmReveal} color="warning" variant="contained" autoFocus>
            Show
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
