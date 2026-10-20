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

import { SectionBox, SectionHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  PieLabelRenderProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface NamedSlice {
  name: string;
  value: number;
  color: string;
}

export interface NamespaceCompliancePoint {
  name: string;
  pass: number;
  failAndError: number;
}

interface ChartAriaProps {
  'aria-labelledby': string;
  'aria-describedby': string;
}

function chartAriaProps(headingId: string, descId: string): ChartAriaProps {
  return {
    'aria-labelledby': headingId,
    'aria-describedby': descId,
  };
}

function HiddenLegend({ payload }: { payload?: Array<{ value?: string; color?: string }> }) {
  return (
    <Box
      component="ul"
      aria-hidden="true"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 2,
        m: 0,
        mt: 1,
        p: 0,
        listStyle: 'none',
      }}
    >
      {payload?.map(item => (
        <Box
          key={String(item.value)}
          component="li"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              bgcolor: item.color,
              borderRadius: '2px',
            }}
          />
          {item.value}
        </Box>
      ))}
    </Box>
  );
}

// Visual slice labels stay on screen but are hidden from assistive technology so
// they do not concatenate into the chart's accessible name.
export function PieSliceLabel({ x, y, textAnchor, name, value }: PieLabelRenderProps) {
  return (
    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" aria-hidden="true">
      {`${name}: ${value}`}
    </text>
  );
}

export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <Box
      component="table"
      sx={{
        width: '100%',
        borderCollapse: 'collapse',
        mt: 1,
        '& caption': {
          captionSide: 'top',
          textAlign: 'left',
          pb: 1,
          fontWeight: 500,
        },
        '& th, & td': {
          borderBottom: 1,
          borderColor: 'divider',
          py: 0.75,
          px: 1,
          textAlign: 'left',
        },
        '& tbody th': { fontWeight: 500 },
        '& th:not(:first-of-type), & td:not(:first-of-type)': { textAlign: 'right' },
      }}
    >
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={String(row[0])}>
            {row.map((cell, index) =>
              index === 0 ? (
                <th key={index} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={index}>{cell}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </Box>
  );
}

function ViewDataDisclosure({
  label,
  caption,
  columns,
  rows,
}: {
  label: string;
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <Box component="details" sx={{ mt: 1 }}>
      <Box
        component="summary"
        sx={{
          cursor: 'pointer',
          py: 0.5,
          fontWeight: 500,
          width: 'fit-content',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        {label}
      </Box>
      <ChartDataTable caption={caption} columns={columns} rows={rows} />
    </Box>
  );
}

function ChartHeading({ id, title }: { id: string; title: string }) {
  return <SectionHeader headerStyle="subsection" title={<span id={id}>{title}</span>} />;
}

export function AccessiblePieChart({
  headingId,
  title,
  description,
  data,
  viewDataLabel,
  nameColumnHeader,
  valueColumnHeader,
}: {
  headingId: string;
  title: string;
  description: string;
  data: NamedSlice[];
  viewDataLabel: string;
  nameColumnHeader: string;
  valueColumnHeader: string;
}) {
  const descId = `${headingId}-desc`;

  return (
    <SectionBox title={<ChartHeading id={headingId} title={title} />}>
      <Typography id={descId} component="p" sx={visuallyHidden}>
        {description}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart
          title={title}
          desc={description}
          accessibilityLayer
          {...chartAriaProps(headingId, descId)}
        >
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            label={PieSliceLabel}
            isAnimationActive={false}
            rootTabIndex={-1}
          >
            {data.map(entry => (
              <Cell key={entry.name} fill={entry.color} aria-hidden="true" />
            ))}
          </Pie>
          <Tooltip />
          <Legend content={HiddenLegend} />
        </PieChart>
      </ResponsiveContainer>
      <ViewDataDisclosure
        label={viewDataLabel}
        caption={title}
        columns={[nameColumnHeader, valueColumnHeader]}
        rows={data.map(entry => [entry.name, entry.value])}
      />
    </SectionBox>
  );
}

export function AccessibleNamespaceChart({
  headingId,
  title,
  description,
  data,
  viewDataLabel,
  namespaceColumnHeader,
  passLabel,
  failErrorLabel,
  passColor,
  failColor,
}: {
  headingId: string;
  title: string;
  description: string;
  data: NamespaceCompliancePoint[];
  viewDataLabel: string;
  namespaceColumnHeader: string;
  passLabel: string;
  failErrorLabel: string;
  passColor: string;
  failColor: string;
}) {
  const descId = `${headingId}-desc`;

  return (
    <SectionBox title={<ChartHeading id={headingId} title={title} />}>
      <Typography id={descId} component="p" sx={visuallyHidden}>
        {description}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
          title={title}
          desc={description}
          accessibilityLayer
          {...chartAriaProps(headingId, descId)}
        >
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend content={HiddenLegend} />
          <Bar
            dataKey="pass"
            fill={passColor}
            name={passLabel}
            stackId="a"
            isAnimationActive={false}
          />
          <Bar
            dataKey="failAndError"
            fill={failColor}
            name={failErrorLabel}
            stackId="a"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      <ViewDataDisclosure
        label={viewDataLabel}
        caption={title}
        columns={[namespaceColumnHeader, passLabel, failErrorLabel]}
        rows={data.map(entry => [entry.name, entry.pass, entry.failAndError])}
      />
    </SectionBox>
  );
}
