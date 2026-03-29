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

import { Icon } from '@iconify/react';
import {
  Badge,
  Box,
  IconButton,
  Link,
  Paper,
  Popper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { ClusterPolicyReport, PolicyReport, PolicyResultStatus } from '../resources/policyReport';

export function ComplianceBadge() {
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const counts = useMemo(() => {
    const result: Record<PolicyResultStatus, number> = {
      pass: 0,
      fail: 0,
      warn: 0,
      error: 0,
      skip: 0,
    };

    for (const report of policyReports || []) {
      const s = report.summary;
      result.pass += s.pass || 0;
      result.fail += s.fail || 0;
      result.warn += s.warn || 0;
      result.error += s.error || 0;
      result.skip += s.skip || 0;
    }

    for (const report of clusterPolicyReports || []) {
      const s = report.summary;
      result.pass += s.pass || 0;
      result.fail += s.fail || 0;
      result.warn += s.warn || 0;
      result.error += s.error || 0;
      result.skip += s.skip || 0;
    }

    return result;
  }, [policyReports, clusterPolicyReports]);

  const violationCount = counts.fail + counts.error + counts.warn;
  const total = counts.pass + counts.fail + counts.warn + counts.error + counts.skip;
  const compliancePct = total > 0 ? Math.round((counts.pass / total) * 100) : 0;

  const badgeColor = violationCount > 0 ? 'error' : 'success';

  return (
    <>
      <Tooltip title="Kyverno Compliance">
        <IconButton
          ref={anchorRef}
          onClick={() => setOpen(prev => !prev)}
          size="small"
          sx={{ color: 'inherit' }}
        >
          <Badge badgeContent={violationCount || undefined} color={badgeColor} max={999}>
            <Icon icon="kyverno:logo" width="24" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" sx={{ zIndex: 1300 }}>
        <Paper elevation={8} sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle2" gutterBottom>
            Kyverno Compliance
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" color={compliancePct >= 90 ? 'success.main' : compliancePct >= 70 ? 'warning.main' : 'error.main'}>
              {compliancePct}% compliant
            </Typography>
            <Typography variant="body2">Pass: {counts.pass}</Typography>
            <Typography variant="body2" color={counts.fail > 0 ? 'error.main' : 'text.secondary'}>
              Fail: {counts.fail}
            </Typography>
            <Typography variant="body2" color={counts.warn > 0 ? 'warning.main' : 'text.secondary'}>
              Warn: {counts.warn}
            </Typography>
            <Typography variant="body2" color={counts.error > 0 ? 'error.main' : 'text.secondary'}>
              Error: {counts.error}
            </Typography>
            <Typography variant="body2">Skip: {counts.skip}</Typography>
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Link href="#/kyverno/violations" underline="hover" variant="body2">
              View all violations
            </Link>
          </Box>
        </Paper>
      </Popper>
    </>
  );
}
