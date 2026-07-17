import {
  EmptyContent,
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Grid, Link, Paper, Typography } from '@mui/material';
import type { ScheduleCoverageResult } from '../coverage';

const learnMoreLink = 'https://github.com/kubernetes-sigs/headlamp/issues/5198';

function formatTimestamp(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function CoverageTable({
  coverage,
  emptyMessage,
}: {
  coverage: ScheduleCoverageResult[];
  emptyMessage: string;
}) {
  if (coverage.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyContent>{emptyMessage}</EmptyContent>
      </Paper>
    );
  }

  return (
    <>
      {coverage.map(entry => (
        <Paper key={entry.scheduleName} variant="outlined" sx={{ mb: 2, p: 2 }}>
          <NameValueTable
            rows={[
              { name: 'Schedule', value: entry.scheduleName },
              { name: 'Cron', value: entry.cronSchedule || 'N/A' },
              { name: 'Next run', value: entry.nextScheduledRun ?? 'N/A' },
              {
                name: 'Last backup',
                value: entry.lastBackup?.name ?? 'No backup yet',
              },
              {
                name: 'Last status',
                value: entry.lastBackup?.phase ?? 'N/A',
              },
              {
                name: 'Last run',
                value: formatTimestamp(
                  entry.lastBackup?.completionTimestamp ?? entry.lastBackup?.startTimestamp
                ),
              },
            ]}
          />
        </Paper>
      ))}
    </>
  );
}

/** Presentational backup coverage panel (install check, loading, error, and schedule rows). */
export interface BackupCoveragePanelPureProps {
  /** False when Velero API is not reachable; null while install check runs. */
  installed: boolean | null;
  loading: boolean;
  error?: Error | null;
  coverage: ScheduleCoverageResult[];
  emptyMessage?: string;
  sectionTitle?: string;
}

export function BackupCoveragePanelPure(props: BackupCoveragePanelPureProps) {
  const {
    installed,
    loading,
    error = null,
    coverage,
    emptyMessage = 'No Velero schedule covers this workload.',
    sectionTitle = 'Velero backup coverage',
  } = props;

  let content = null;

  if (installed === false) {
    content = (
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h6">Velero not detected in this cluster</Typography>
        </Grid>
        <Typography>
          <Link href={learnMoreLink} target="_blank">
            Learn more about the Velero plugin.
          </Link>
        </Typography>
      </Grid>
    );
  } else if (error) {
    content = (
      <Paper variant="outlined">
        <EmptyContent>
          Failed to load Velero schedules or backups. Check RBAC for velero.io resources in the
          Velero namespace ({error.message}).
        </EmptyContent>
      </Paper>
    );
  } else if (loading || installed === null) {
    content = (
      <Box sx={{ width: '100%' }}>
        <Loader title="Loading Velero backup coverage" />
      </Box>
    );
  } else {
    content = <CoverageTable coverage={coverage} emptyMessage={emptyMessage} />;
  }

  return (
    <SectionBox
      title={
        <div id="velero-plugin-backup-coverage-section">
          <SectionHeader title={sectionTitle} />
        </div>
      }
    >
      {content}
    </SectionBox>
  );
}
