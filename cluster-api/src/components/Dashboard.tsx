import { Icon } from '@iconify/react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, Paper, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <SectionBox title="Cluster API">
      <Paper
        elevation={0}
        sx={{
          p: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: 'background.default',
          border: '1px dashed',
          borderColor: 'divider',
          mt: 2,
        }}
      >
        <Icon
          icon="mdi:alert-outline"
          width="80px"
          height="80px"
          style={{ color: '#ed6c02', marginBottom: '24px' }}
        />
        <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
          Cluster API Not Detected
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, lineHeight: 1.6 }}
        >
          The Custom Resource Definitions (CRDs) required for the Kubernetes Cluster API (CAPI) were
          not found in the currently active cluster. You need to initialize a management cluster to
          manage and visualize your resources here.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="https://cluster-api.sigs.k8s.io/user/quick-start.html"
          target="_blank"
          rel="noopener noreferrer"
          size="large"
          sx={{ px: 4, py: 1.2, textTransform: 'none', fontWeight: 500, borderRadius: 1.5 }}
        >
          Open Quick Start Guide
        </Button>
      </Paper>
    </SectionBox>
  );
}
