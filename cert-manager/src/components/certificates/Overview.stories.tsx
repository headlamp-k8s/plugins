import {
  Box, Card, CardContent, Chip, Grid,
  Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography
} from "@mui/material";
import { Meta, StoryFn } from "@storybook/react";

interface MockCertificate {
  metadata: { name: string; namespace: string };
  status?: { notAfter?: string };
}

interface PureOverviewProps {
  totalCount: number;
  expiringSoon: MockCertificate[];
  expired: MockCertificate[];
}

function SummaryCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}

function ExpiryChip({ notAfter }: { notAfter?: string }) {
  if (!notAfter) return <Chip label="Unknown" size="small" />;
  const ms = Date.parse(notAfter);
  if (Number.isNaN(ms)) return <Chip label="Unknown" size="small" />;
  const days = Math.floor((ms - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0)  return <Chip label="Expired"        size="small" color="error" />;
  if (days < 7)  return <Chip label={`${days} days`} size="small" color="error" />;
  if (days <= 30) return <Chip label={`${days} days`} size="small" color="warning" />;
  return              <Chip label={`${days} days`} size="small" color="success" />;
}

function PureCertificatesOverview({ totalCount, expiringSoon, expired }: PureOverviewProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>cert-manager Overview</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard title="Certificates"   value={totalCount}          subtitle="Total certificates" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard title="Expiring soon"  value={expiringSoon.length} subtitle="Within 30 days or already expired" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard title="Expired"        value={expired.length}      subtitle="Past Not After" />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>Certificates expiring soon</Typography>
      {expiringSoon.length === 0 ? (
        <Typography color="text.secondary">No certificates expiring soon</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Namespace</strong></TableCell>
                <TableCell><strong>Expires In</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expiringSoon.map(item => (
                <TableRow key={item.metadata.name}>
                  <TableCell>{item.metadata.name}</TableCell>
                  <TableCell>{item.metadata.namespace}</TableCell>
                  <TableCell><ExpiryChip notAfter={item.status?.notAfter} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default {
  title: "cert-manager/Certificates/Overview",
  component: PureCertificatesOverview,
} as Meta;

const Template: StoryFn<PureOverviewProps> = args => <PureCertificatesOverview {...args} />;

const in3Days   = new Date(Date.now() + 3  * 864e5).toISOString();
const in15Days  = new Date(Date.now() + 15 * 864e5).toISOString();
const yesterday = new Date(Date.now() - 1  * 864e5).toISOString();
const lastMonth = new Date(Date.now() - 30 * 864e5).toISOString();

const expiringSoonMock: MockCertificate[] = [
  { metadata: { name: "api-tls",     namespace: "production" }, status: { notAfter: in3Days } },
  { metadata: { name: "web-tls",     namespace: "default"    }, status: { notAfter: in15Days } },
  { metadata: { name: "old-cert",    namespace: "staging"    }, status: { notAfter: yesterday } },
  { metadata: { name: "legacy-cert", namespace: "default"    }, status: { notAfter: lastMonth } },
];
const expiredMock = expiringSoonMock.filter(
  c => c.status?.notAfter && c.status.notAfter < new Date().toISOString()
);

export const WithExpiringSoon = Template.bind({});
WithExpiringSoon.args = { totalCount: 12, expiringSoon: expiringSoonMock, expired: expiredMock };

export const AllHealthy = Template.bind({});
AllHealthy.args = { totalCount: 8, expiringSoon: [], expired: [] };

export const OnlyExpired = Template.bind({});
OnlyExpired.args = { totalCount: 3, expiringSoon: expiredMock, expired: expiredMock };
