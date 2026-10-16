import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';

export interface ParsedMetricSample {
  name: string;
  labels: Record<string, string>;
  value: string;
}

export interface ParsedMetricFamily {
  name: string;
  help?: string;
  type?: string;
  samples: ParsedMetricSample[];
}

export interface MetricsViewProps {
  rawMetrics: string;
  parsedMetrics: ParsedMetricFamily[];
  error?: string | null;
  loading?: boolean;
  onCopyRaw: () => void;
}

export function parsePrometheusMetrics(raw: string): ParsedMetricFamily[] {
  const families = new Map<string, ParsedMetricFamily>();

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('# EOF')) {
      continue;
    }
    if (line.startsWith('# HELP ')) {
      const [, , name, ...rest] = line.split(' ');
      const family = families.get(name) ?? { name, samples: [] };
      family.help = rest.join(' ');
      families.set(name, family);
      continue;
    }
    if (line.startsWith('# TYPE ')) {
      const [, , name, type] = line.split(' ');
      const family = families.get(name) ?? { name, samples: [] };
      family.type = type;
      families.set(name, family);
      continue;
    }

    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+(.+)$/);
    if (!match) {
      continue;
    }
    const [, name, , labelText = '', value] = match;
    const labels: Record<string, string> = {};
    if (labelText) {
      for (const pair of labelText.split(',')) {
        const trimmed = pair.trim();
        if (!trimmed) {
          continue;
        }
        const eq = trimmed.indexOf('=');
        if (eq === -1) {
          continue;
        }
        const key = trimmed.slice(0, eq);
        const rawValue = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '');
        labels[key] = rawValue;
      }
    }
    const family = families.get(name) ?? { name, samples: [] };
    family.samples.push({ name, labels, value });
    families.set(name, family);
  }

  return [...families.values()].filter((family) => family.samples.length > 0 || family.help || family.type);
}

export function MetricsView({ rawMetrics, parsedMetrics, error, loading, onCopyRaw }: MetricsViewProps) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (loading) {
    return <Typography variant="body2">Loading metrics...</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Button variant="outlined" size="small" onClick={onCopyRaw} disabled={!rawMetrics}>
        Copy raw metrics
      </Button>
      {rawMetrics.trim().length === 0 ? (
        <Alert severity="info">The metrics endpoint returned no data.</Alert>
      ) : parsedMetrics.length === 0 ? (
        <Stack spacing={1}>
          <Alert severity="warning">The metrics payload could not be parsed as Prometheus metrics.</Alert>
          <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {rawMetrics}
          </Box>
        </Stack>
      ) : (
        parsedMetrics.map((family) => (
          <Paper key={family.name} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">{family.name}</Typography>
              {family.help ? (
                <Typography variant="body2" color="text.secondary">
                  {family.help}
                </Typography>
              ) : null}
              <Typography variant="caption" color="text.secondary">
                {family.type ? `Type: ${family.type}` : 'Metric family'}
              </Typography>
              <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {family.samples.slice(0, 10).map((sample) => {
                  const labelSuffix =
                    Object.keys(sample.labels).length > 0
                      ? ` {${Object.entries(sample.labels)
                          .map(([key, value]) => `${key}="${value}"`)
                          .join(', ')}}`
                      : '';
                  return `${sample.name}${labelSuffix} ${sample.value}`;
                }).join('\n')}
              </Box>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
}
