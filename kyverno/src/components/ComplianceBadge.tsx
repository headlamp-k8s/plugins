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
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Badge,
  Box,
  IconButton,
  Link,
  Menu,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ClusterPolicyReport, PolicyReport, PolicyResultStatus } from '../resources/policyReport';

export function ComplianceBadge() {
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const history = useHistory();
  const cluster = K8s.useCluster();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
  const compliancePct = total > 0 ? Math.round((counts.pass / total) * 100) : 100;

  const badgeColor = violationCount > 0 ? 'error' : 'success';

  return (
    <>
      <Tooltip title="Kyverno Compliance">
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{ color: 'inherit' }}
        >
          <Badge badgeContent={violationCount || undefined} color={badgeColor} max={999}>
            <Icon icon="kyverno:logo" width="24" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { p: 2, minWidth: 220, mt: 1 },
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Kyverno Compliance
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            variant="body2"
            color={
              compliancePct >= 90
                ? 'success.main'
                : compliancePct >= 70
                ? 'warning.main'
                : 'error.main'
            }
          >
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
          <Link
            component="button"
            onClick={() => {
              handleClose();
              const violationsPath = cluster ? `/c/${cluster}/kyverno/violations` : '/kyverno/violations';
              history.push(violationsPath);
            }}
            underline="hover"
            variant="body2"
          >
            View all violations
          </Link>
        </Box>
      </Menu>
    </>
  );
}
