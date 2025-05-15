import { ApiError, request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import React from 'react';
import Table from '../common/Table';
import EventDetailDialog from '../components/EventDetailDialog';
import K8sSourceCell from '../components/K8sSourceCell';
import MessageCell from '../components/MessageCell';
import SeverityColumn from '../components/SeverityColumn';
import TagsCell from '../components/TagsCell';
import { FalcoEvent } from '../types/FalcoEvent';
import {
  formatFalcoTime,
  getEventUser,
  getK8sSource,
  getNamespace,
  getSeverityColor,
} from '../utils/falcoEventUtils';
import { detectFalcoFileOutputPath } from '../utils/falcoPodUtils';

/**
 * Namespace and label selector for Falco pods
 */
const FALCO_NAMESPACE = 'falco';
const FALCO_LABEL_SELECTOR = 'app.kubernetes.io/name=falco';

/**
 * The main FalcoEvents component.
 * @returns The FalcoEvents component.
 */
export default function FalcoEvents() {
  // Persisted settings (selected backend & optional Redis URL)
  const STORAGE_KEY = 'falco_event_storage_settings';
  const loadSettings = () => {
    try {
      return (
        JSON.parse(localStorage.getItem(STORAGE_KEY) || '') || {
          backend: 'file',
          redisUrl: '',
        }
      );
    } catch {
      return { backend: 'file', redisUrl: '' } as { backend: string; redisUrl?: string };
    }
  };

  // Settings & component state
  const [settings, setSettings] = React.useState<{ backend: string; redisUrl?: string }>(
    loadSettings()
  );
  const [events, setEvents] = React.useState<FalcoEvent[]>([]);
  const [falcoPods, setFalcoPods] = React.useState<Pod[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<FalcoEvent | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

  const filterFunction = useFilterFunc();

  // Only severity summary remains
  const severities = React.useMemo(() => {
    return Array.from(new Set(events.map(ev => ev.priority || '').filter(Boolean)));
  }, [events]);

  // Fetch Falco pods
  React.useEffect(() => {
    ResourceClasses.Pod.apiList(
      (pods: Pod[]) => {
        const falcoPods = pods.filter(
          pod =>
            pod.getNamespace() === FALCO_NAMESPACE &&
            pod.jsonData?.metadata?.labels?.['app.kubernetes.io/name'] === 'falco'
        );
        setFalcoPods(falcoPods);
      },
      (err: ApiError) => {
        setFalcoPods([]);
        console.error('Failed to fetch Falco pods:', err);
      },
      { namespace: FALCO_NAMESPACE, queryParams: { labelSelector: FALCO_LABEL_SELECTOR } }
    )();
  }, []);

  // Keep settings in-sync if the user changes them in the Settings page (localStorage "storage" event)
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSettings(loadSettings());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Stream Falco events from pod *only* when the backend is "file"
  React.useEffect(() => {
    if (settings.backend !== 'file') return;
    if (!falcoPods.length) return;
    let stopped = false;
    let buffer = '';

    setEvents([]);
    const pod = falcoPods[0];
    const handleData = (output: string | ArrayBuffer | { data?: string | ArrayBuffer }) => {
      if (stopped) return;
      let chunk = '';
      if (typeof output === 'string') chunk = output;
      else if (output instanceof ArrayBuffer) chunk = new TextDecoder().decode(output);
      else if (ArrayBuffer.isView(output))
        chunk = new TextDecoder().decode((output as ArrayBufferView).buffer);
      else if (output?.data) {
        if (typeof output.data === 'string') chunk = output.data;
        else if (output.data instanceof ArrayBuffer) chunk = new TextDecoder().decode(output.data);
        else if (ArrayBuffer.isView(output.data))
          chunk = new TextDecoder().decode((output.data as ArrayBufferView).buffer);
      }
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      const newEvents = lines
        .map(line => {
          const clean = line.replace(/^[\x00-\x1F\x7F]+/, '').trim();
          if (!clean.startsWith('{') || !clean.endsWith('}')) return null;
          try {
            const obj = JSON.parse(clean);
            if (obj?.metadata && obj?.status === 'Success') return null;
            return obj;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (newEvents.length > 0) setEvents(prev => [...prev, ...newEvents]);
    };
    const handleError = (err: unknown) => {
      if (stopped) return;
      let msg = '';
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as any).message === 'string'
      ) {
        msg = (err as any).message;
      } else if (typeof err === 'string') {
        msg = err;
      }
      console.error('Falco exec error:', msg);
    };
    try {
      pod.exec('falco', handleData, {
        command: ['tail', '-n', '+1', '-F', detectFalcoFileOutputPath(pod.jsonData)],
      });
    } catch (err: any) {
      handleError(err);
    }
    return () => {
      stopped = true;
    };
  }, [falcoPods, settings]);

  // Poll Redis REST proxy when the backend is "redis"
  React.useEffect(() => {
    if (settings.backend !== 'redis') return;
    let stopped = false;
    setEvents([]);

    const fetchEvents = async () => {
      if (stopped) return;
      try {
        let data;

        if (settings.redisUrl) {
          // For external URLs, use fetch
          const resp = await fetch(`${settings.redisUrl.replace(/\/+$/, '')}/events?limit=300`);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          data = await resp.json();
        } else {
          // For in-cluster API proxy, use request
          try {
            data = await request(
              `/api/v1/namespaces/${FALCO_NAMESPACE}/services/redis-rest-proxy:8080/proxy/events?limit=300`,
              { method: 'GET' }
            );
          } catch (requestErr: any) {
            console.error('Error details:', requestErr);
            // If empty array response caused parsing issues, treat as empty array
            if (requestErr.message && requestErr.message.includes('Unexpected token')) {
              data = [];
            } else {
              throw requestErr;
            }
          }
        }

        if (Array.isArray(data)) {
          setEvents(data as FalcoEvent[]);
        }
      } catch (err) {
        if (!stopped) {
          console.error('Failed to fetch events from Redis REST proxy:', err);
        }
      }
    };

    // Initial fetch + interval
    fetchEvents();
    const id = setInterval(fetchEvents, 5000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [settings]);

  return (
    <SectionBox title={<SectionFilterHeader title="Security Events" noNamespaceFilter />}>
      {/* Severity Summary Bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, mt: 1 }}>
        {/* Total */}
        <Chip
          label={<span style={{ fontWeight: 600 }}>Total: {events.length}</span>}
          sx={{
            background: '#b3e0ff',
            color: '#444',
            fontWeight: 600,
            fontSize: '0.95em',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            height: 32,
          }}
        />
        {/* Per-severity counts */}
        {severities.map(sev => {
          const count = events.filter(
            ev => (ev.priority || '').toLowerCase() === sev.toLowerCase()
          ).length;
          return (
            <Chip
              key={sev}
              label={
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {sev}: {count}
                </span>
              }
              sx={{
                background: getSeverityColor(sev),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95em',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                height: 32,
              }}
            />
          );
        })}
      </Box>
      <Table
        columns={[
          {
            header: 'Time',
            accessorFn: (row: FalcoEvent) => formatFalcoTime(row),
          },
          {
            header: 'Severity',
            accessorFn: (row: FalcoEvent) => row.priority || '',
            Cell: ({ row }) => <SeverityColumn ev={row.original} />,
          },
          {
            header: 'User',
            accessorFn: (row: FalcoEvent) => getEventUser(row),
          },
          {
            header: 'K8s Source',
            accessorFn: (row: FalcoEvent) => {
              const { kind, name } = getK8sSource(row);
              return kind && name ? `${kind}/${name}` : name || 'N/A';
            },
            Cell: ({ row }) => <K8sSourceCell event={row.original} />,
          },
          {
            header: 'Namespace',
            accessorFn: (row: FalcoEvent) => getNamespace(row),
          },
          {
            header: 'Rule',
            accessorFn: (row: FalcoEvent) => row.rule || '',
          },
          {
            header: 'Tags',
            accessorFn: (row: FalcoEvent) => (Array.isArray(row.tags) ? row.tags.join(', ') : ''),
            Cell: ({ row }) =>
              Array.isArray(row.original.tags) ? <TagsCell tags={row.original.tags} /> : '-',
          },
          {
            header: 'Message',
            accessorFn: (row: FalcoEvent) => row.output || row.msg || '',
            Cell: ({ row }) => {
              const fullText = row.original.output || row.original.msg || '';
              return (
                <MessageCell
                  message={fullText}
                  fullText={fullText}
                  onClick={() => {
                    setSelectedEvent(row.original);
                    setDetailDialogOpen(true);
                  }}
                />
              );
            },
          },
        ]}
        data={events}
        filterFunction={filterFunction}
        emptyMessage={
          <span style={{ color: '#888', fontSize: '1.1em' }}>Waiting for events...</span>
        }
        rowProps={() => ({
          style: {
            cursor: 'default',
          },
        })}
      />

      {/* Event detail dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </SectionBox>
  );
}
