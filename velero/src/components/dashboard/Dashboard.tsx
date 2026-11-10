import { Link, SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  type BackupPhaseCounts,
  type PhaseCountedItem,
  type ScheduleHealthCounts,
  type StorageHealthItem,
} from '../../dashboard/summary';
import { useVeleroDashboard } from '../../hooks/useVeleroDashboard';
import { getBackupStatusColor, getStorageStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

const COLORS = {
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  muted: '#9e9e9e',
  info: '#2196f3',
};

type Slice = { name: string; value: number; color: string };

function toSlices(entries: Array<{ name: string; value: number; color: string }>): Slice[] {
  return entries.filter(e => e.value > 0);
}

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color?: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ color: color || 'text.primary', fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function DonutChart({ data, emptyLabel }: { data: Slice[]; emptyLabel: string }) {
  if (data.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={260}
        color="text.secondary"
      >
        <Typography variant="body2">{emptyLabel}</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function QuickLinks() {
  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      <Link routeName={veleroRouteNames.schedulesList}>Schedules</Link>
      <Link routeName={veleroRouteNames.backupsList}>Backups</Link>
      <Link routeName={veleroRouteNames.restoresList}>Restores</Link>
      <Link routeName={veleroRouteNames.bslList}>Storage Locations</Link>
    </Box>
  );
}

function FailedTable({ items, detailRoute }: { items: PhaseCountedItem[]; detailRoute: string }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Started</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(item => (
          <TableRow key={`${item.cluster ?? ''}/${item.namespace}/${item.name}`}>
            <TableCell>
              <Link
                routeName={detailRoute}
                params={{ namespace: item.namespace, name: item.name }}
                activeCluster={item.cluster}
              >
                {item.name}
              </Link>
            </TableCell>
            <TableCell>
              <StatusLabel status={getBackupStatusColor(item.phase)}>{item.phase}</StatusLabel>
            </TableCell>
            <TableCell>
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StorageTable({ items }: { items: StorageHealthItem[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Provider</TableCell>
          <TableCell>Bucket</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(item => (
          <TableRow key={`${item.cluster ?? ''}/${item.namespace}/${item.name}`}>
            <TableCell>
              <Link
                routeName={veleroRouteNames.bslDetail}
                params={{ namespace: item.namespace, name: item.name }}
                activeCluster={item.cluster}
              >
                {item.name}
              </Link>
            </TableCell>
            <TableCell>
              <StatusLabel status={getStorageStatusColor(item.phase)}>{item.phase}</StatusLabel>
            </TableCell>
            <TableCell>{item.provider ?? '—'}</TableCell>
            <TableCell>{item.bucket ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function backupSlices(c: BackupPhaseCounts): Slice[] {
  return toSlices([
    { name: 'Completed', value: c.completed, color: COLORS.success },
    { name: 'Failed / partial', value: c.failed, color: COLORS.error },
    { name: 'In progress', value: c.inProgress, color: COLORS.warning },
    { name: 'Other', value: c.other, color: COLORS.muted },
  ]);
}

function scheduleSlices(c: ScheduleHealthCounts): Slice[] {
  return toSlices([
    { name: 'Active', value: c.active, color: COLORS.success },
    { name: 'Paused', value: c.paused, color: COLORS.warning },
    { name: 'Failed validation', value: c.failedValidation, color: COLORS.error },
    { name: 'Other', value: c.other, color: COLORS.muted },
  ]);
}

function DashboardContent() {
  const data = useVeleroDashboard();

  const charts = useMemo(
    () => ({
      backups: backupSlices(data.backups),
      schedules: scheduleSlices(data.schedules),
      restores: backupSlices(data.restores),
    }),
    [data.backups, data.schedules, data.restores]
  );

  if (data.loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.error) {
    return (
      <SectionBox title="Velero Overview">
        <Typography color="error">{data.error.message}</Typography>
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox title="Velero Overview">
        <QuickLinks />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Backups" value={data.backups.total} color={COLORS.info} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Schedules" value={data.schedules.total} color={COLORS.info} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Restores" value={data.restores.total} color={COLORS.info} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard
              title="BSL available"
              value={`${data.storage.available}/${data.storage.total}`}
              color={data.storage.unavailable > 0 ? COLORS.error : COLORS.success}
            />
          </Grid>
        </Grid>
      </SectionBox>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SectionBox title="Backups by status">
            <DonutChart data={charts.backups} emptyLabel="No backups yet." />
          </SectionBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionBox title="Schedules by health">
            <DonutChart data={charts.schedules} emptyLabel="No schedules yet." />
          </SectionBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionBox title="Restores by status">
            <DonutChart data={charts.restores} emptyLabel="No restores yet." />
          </SectionBox>
        </Grid>
      </Grid>

      <SectionBox title="Storage locations">
        <StorageTable items={data.storageLocations} />
      </SectionBox>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SectionBox title="Recent failed backups">
            <FailedTable
              items={data.recentFailedBackups}
              detailRoute={veleroRouteNames.backupDetail}
            />
          </SectionBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionBox title="Recent failed restores">
            <FailedTable
              items={data.recentFailedRestores}
              detailRoute={veleroRouteNames.restoreDetail}
            />
          </SectionBox>
        </Grid>
      </Grid>
    </>
  );
}

/** Phase 5 — cluster-wide Velero backup health overview. */
export default function VeleroDashboard() {
  return (
    <VeleroInstallCheck>
      <DashboardContent />
    </VeleroInstallCheck>
  );
}
