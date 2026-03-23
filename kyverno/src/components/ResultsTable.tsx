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

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PolicyReportResult } from '../resources/policyReport';
import { ResultStatusChip, SeverityChip } from './common';

export function ResultsTable({ results }: { results: PolicyReportResult[] }) {
  if (results.length === 0) {
    return <p>No results found.</p>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Policy</TableCell>
            <TableCell>Rule</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Resource</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={`${result.policy}-${result.rule}-${index}`}>
              <TableCell>{result.policy}</TableCell>
              <TableCell>{result.rule || '-'}</TableCell>
              <TableCell>
                <ResultStatusChip status={result.result} />
              </TableCell>
              <TableCell>
                <SeverityChip severity={result.severity} />
              </TableCell>
              <TableCell>{result.category || '-'}</TableCell>
              <TableCell style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {result.message || '-'}
              </TableCell>
              <TableCell>
                {result.resources?.map((r, i) => (
                  <span key={i}>
                    {r.kind}/{r.name}
                    {i < (result.resources?.length || 0) - 1 ? ', ' : ''}
                  </span>
                )) || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
