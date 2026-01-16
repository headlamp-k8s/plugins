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

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Condition } from '../../../../../resources/knative/common';
import { getAge } from '../../../../../utils/time';

type ConditionsSectionProps = {
  conditions: Condition[];
};

export default function ConditionsSection({ conditions }: ConditionsSectionProps) {
  return (
    <SectionBox title="Conditions">
      <TableContainer>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Last Transition</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conditions.map(c => (
              <TableRow key={c.type}>
                <TableCell>{c.type}</TableCell>
                <TableCell>
                  {c.status === 'True' ? (
                    <Chip label="True" color="success" size="small" />
                  ) : c.status === 'False' ? (
                    <Chip label="False" color="error" size="small" />
                  ) : (
                    <Chip label={c.status || 'Unknown'} color="warning" size="small" />
                  )}
                </TableCell>
                <TableCell>{c.reason || '-'}</TableCell>
                <TableCell>
                  {c.message ? (
                    <Tooltip title={c.message}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 400 }}
                      >
                        {c.message}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ maxWidth: 400 }}
                    >
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{c.lastTransitionTime ? getAge(c.lastTransitionTime) : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionBox>
  );
}
