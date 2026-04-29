/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KyvernoClusterPolicy, KyvernoPolicy } from '../resources/kyvernoPolicy';
import { ClusterPolicyReport, PolicyReport, PolicyResultStatus } from '../resources/policyReport';

const STATUS_COLORS: Record<PolicyResultStatus, string> = {
  pass: '#4caf50',
  fail: '#f44336',
  warn: '#ff9800',
  error: '#d32f2f',
  skip: '#9e9e9e',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#b71c1c',
  high: '#d32f2f',
  medium: '#ff9800',
  low: '#2196f3',
  info: '#9e9e9e',
};

function MetricCard({ title, value, color }: { title: string; value: string | number; color?: string }) {
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

export function Dashboard() {
  const [clusterPolicies] = KyvernoClusterPolicy.useList();
  const [policies] = KyvernoPolicy.useList();
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

  const stats = useMemo(() => {
    const counts: Record<PolicyResultStatus, number> = { pass: 0, fail: 0, warn: 0, error: 0, skip: 0 };
    const byCategory = new Map<string, number>();
    const bySeverity = new Map<string, number>();
    const byNamespace = new Map<string, { pass: number; fail: number }>();

    const allReports = [...(policyReports || []), ...(clusterPolicyReports || [])];

    for (const report of allReports) {
      for (const result of report.results) {
        counts[result.result] = (counts[result.result] || 0) + 1;

        if (result.result === 'fail' || result.result === 'error') {
          const cat = result.category || 'Uncategorized';
          byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
        }

        if (result.severity) {
          bySeverity.set(result.severity, (bySeverity.get(result.severity) || 0) + 1);
        }

        const ns = result.resources?.[0]?.namespace || report.jsonData.metadata.namespace || 'cluster';
        const nsStats = byNamespace.get(ns) || { pass: 0, fail: 0 };
        if (result.result === 'pass') nsStats.pass++;
        if (result.result === 'fail' || result.result === 'error') nsStats.fail++;
        byNamespace.set(ns, nsStats);
      }
    }

    const totalPolicies = (clusterPolicies?.length || 0) + (policies?.length || 0);
    const enforceCount = [...(clusterPolicies || []), ...(policies || [])].filter(
      p => p.validationFailureAction === 'Enforce'
    ).length;
    const auditCount = totalPolicies - enforceCount;
    const total = counts.pass + counts.fail + counts.warn + counts.error + counts.skip;
    const compliancePct = total > 0 ? Math.round((counts.pass / total) * 100) : 100;

    return { counts, totalPolicies, enforceCount, auditCount, total, compliancePct, byCategory, bySeverity, byNamespace };
  }, [clusterPolicies, policies, policyReports, clusterPolicyReports]);

  const statusData = useMemo(() => {
    return (['pass', 'fail', 'warn', 'error', 'skip'] as PolicyResultStatus[])
      .filter(s => stats.counts[s] > 0)
      .map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: stats.counts[status],
        color: STATUS_COLORS[status],
      }));
  }, [stats.counts]);

  const categoryData = useMemo(() => {
    return Array.from(stats.byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [stats.byCategory]);

  const severityData = useMemo(() => {
    const order = ['critical', 'high', 'medium', 'low', 'info'];
    return order
      .filter(s => stats.bySeverity.has(s))
      .map(severity => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: stats.bySeverity.get(severity) || 0,
        color: SEVERITY_COLORS[severity],
      }));
  }, [stats.bySeverity]);

  const namespaceData = useMemo(() => {
    return Array.from(stats.byNamespace.entries())
      .filter(([ns]) => ns !== 'cluster')
      .sort(([, a], [, b]) => b.fail - a.fail)
      .slice(0, 10)
      .map(([ns, { pass, fail }]) => ({ name: ns, pass, failAndError: fail }));
  }, [stats.byNamespace]);

  const isLoading = clusterPolicies === null || policies === null || policyReports === null || clusterPolicyReports === null;

  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title="Kyverno Overview">
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Total Policies" value={isLoading ? '...' : stats.totalPolicies} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard
              title="Compliance"
              value={isLoading ? '...' : `${stats.compliancePct}%`}
              color={stats.compliancePct >= 90 ? '#4caf50' : stats.compliancePct >= 70 ? '#ff9800' : '#f44336'}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Enforce" value={isLoading ? '...' : stats.enforceCount} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Audit" value={isLoading ? '...' : stats.auditCount} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Pass" value={stats.counts.pass} color="#4caf50" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Fail" value={stats.counts.fail} color="#f44336" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Warn" value={stats.counts.warn} color="#ff9800" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard title="Error" value={stats.counts.error} color="#d32f2f" />
          </Grid>
        </Grid>
      </SectionBox>

      <Grid container spacing={2}>
        {statusData.length > 0 && (
          <Grid item xs={12} md={6}>
            <SectionBox title="Results by Status">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </SectionBox>
          </Grid>
        )}

        {severityData.length > 0 && (
          <Grid item xs={12} md={6}>
            <SectionBox title="Results by Severity">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </SectionBox>
          </Grid>
        )}

        {categoryData.length > 0 && (
          <Grid item xs={12}>
            <SectionBox title="Top Failing Categories">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
                {categoryData.map(({ name, value }) => {
                  const maxVal = categoryData[0].value;
                  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                  return (
                    <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" sx={{ minWidth: 180, textAlign: 'right', flexShrink: 0 }}>
                        {name}
                      </Typography>
                      <Box sx={{ flex: 1, height: 20, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: '#f44336', borderRadius: 1, minWidth: 2 }} />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 36, fontWeight: 'bold' }}>
                        {value}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </SectionBox>
          </Grid>
        )}

        {namespaceData.length > 0 && (
          <Grid item xs={12}>
            <SectionBox title="Compliance by Namespace (Top 10)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={namespaceData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pass" fill={STATUS_COLORS.pass} name="Pass" stackId="a" />
                  <Bar dataKey="failAndError" fill={STATUS_COLORS.fail} name="Fail" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </SectionBox>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
