/*
 * Copyright 2026 The Kubernetes Authors
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
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { collapseUnchanged, diffLines, hasChanges } from '../helm/diff';
import { maskManifest, maskValues } from '../helm/masking';
import { chartLabel, HelmRevision, ValuesMap } from '../helm/release';
import { coalesceValues, valuesToYaml } from '../helm/values';
import { CodeBlock, DiffBlock } from './CodeBlock';

type ValuesKind = 'user' | 'defaults' | 'computed';

const VALUES_TABS: { kind: ValuesKind; label: string }[] = [
  { kind: 'user', label: 'User-supplied values' },
  { kind: 'defaults', label: 'Chart default values' },
  { kind: 'computed', label: 'Computed values' },
];

const REVEAL_LABEL = 'Show sensitive values';

function valuesOf(revision: HelmRevision, kind: ValuesKind): ValuesMap {
  if (kind === 'user') return revision.userValues;
  if (kind === 'defaults') return revision.defaultValues;
  return coalesceValues(revision.defaultValues, revision.userValues);
}

/** YAML of the values of a revision, with the sensitive ones masked unless revealed. */
function renderValues(revision: HelmRevision, kind: ValuesKind, reveal: boolean) {
  const values = valuesOf(revision, kind);
  if (reveal) return { text: valuesToYaml(values), hidden: 0 };
  const masked = maskValues(values);
  return { text: valuesToYaml(masked.value), hidden: masked.hidden };
}

function hiddenCaption(hidden: number): string | undefined {
  if (hidden === 0) return undefined;
  return `${hidden} sensitive ${hidden === 1 ? 'value' : 'values'} hidden.`;
}

function describeValues(revision: HelmRevision, kind: ValuesKind): string {
  if (kind === 'user') return 'Values given when the revision was installed or upgraded.';
  if (kind === 'defaults') return `Defaults shipped with the chart ${chartLabel(revision)}.`;
  return 'Chart defaults overridden by the user-supplied values.';
}

function ValuesPanel(props: { revision: HelmRevision; kind: ValuesKind; reveal: boolean }) {
  const { revision, kind, reveal } = props;
  const { text, hidden } = useMemo(
    () => renderValues(revision, kind, reveal),
    [revision, kind, reveal]
  );
  const label = VALUES_TABS.find(tab => tab.kind === kind)?.label ?? 'Values';

  if (text === '') {
    return (
      <Typography variant="body2" color="text.secondary" py={2}>
        {kind === 'user'
          ? 'No user-supplied values: this revision runs with the chart defaults.'
          : 'This chart has no values.'}
      </Typography>
    );
  }

  return (
    <CodeBlock
      text={text}
      label={label}
      caption={[describeValues(revision, kind), hiddenCaption(hidden)].filter(Boolean).join(' ')}
    />
  );
}

function CompareValues(props: {
  revision: HelmRevision;
  revisions: HelmRevision[];
  reveal: boolean;
}) {
  const { revision, revisions, reveal } = props;
  const others = revisions.filter(other => other.revision !== revision.revision);
  // Revisions are sorted the most recent first: the first older one is the previous revision.
  const previous = others.find(other => other.revision < revision.revision) ?? others[0];
  const [baseRevision, setBaseRevision] = useState<number>();
  const [kind, setKind] = useState<ValuesKind>('user');
  const base = others.find(other => other.revision === baseRevision) ?? previous;

  const comparison = useMemo(() => {
    if (!base) return undefined;
    const lines = diffLines(
      renderValues(base, kind, reveal).text,
      renderValues(revision, kind, reveal).text
    );
    return { changed: hasChanges(lines), rows: collapseUnchanged(lines) };
  }, [base, revision, kind, reveal]);

  if (!base || !comparison) {
    return (
      <Typography variant="body2" color="text.secondary">
        This release has no other revision to compare with.
      </Typography>
    );
  }

  const summary = `Changes from revision ${base.revision} to revision ${revision.revision}.`;

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
        <TextField
          select
          size="small"
          label="Compare with"
          value={base.revision}
          onChange={event => setBaseRevision(Number(event.target.value))}
          SelectProps={{ native: true }}
        >
          {others.map(other => (
            <option key={other.revision} value={other.revision}>
              {`Revision ${other.revision} (${other.status})`}
            </option>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Values"
          value={kind}
          onChange={event => setKind(event.target.value as ValuesKind)}
          SelectProps={{ native: true }}
        >
          <option value="user">User-supplied</option>
          <option value="computed">Computed</option>
        </TextField>
      </Box>
      {comparison.changed ? (
        <DiffBlock
          rows={comparison.rows}
          label="Values comparison"
          caption={reveal ? summary : `${summary} Hidden sensitive values are not compared.`}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {reveal
            ? `These values are identical in revisions ${base.revision} and ${revision.revision}.`
            : `These values are identical in revisions ${base.revision} and ${revision.revision}, hidden sensitive values aside.`}
        </Typography>
      )}
    </Box>
  );
}

type PreparedManifest = { text: string; hidden: number } | 'unparsable';

function ManifestPanel({ manifest, reveal }: { manifest: string; reveal: boolean }) {
  const [masked, setMasked] = useState<PreparedManifest>();

  useEffect(() => {
    setMasked(undefined);
    if (reveal) return;
    // Parsing a large manifest takes a moment: let the loader render first.
    const timer = window.setTimeout(() => {
      try {
        const result = maskManifest(manifest);
        setMasked({ text: result.value, hidden: result.hidden });
      } catch {
        setMasked('unparsable');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [manifest, reveal]);

  if (manifest.trim() === '') {
    return (
      <Typography variant="body2" color="text.secondary">
        This revision has no rendered manifest.
      </Typography>
    );
  }

  if (reveal) {
    return <CodeBlock text={manifest} label="Rendered manifest" caption="As stored by Helm." />;
  }
  if (!masked) return <Loader title="Preparing the manifest" />;
  if (masked === 'unparsable') {
    return (
      <Alert severity="warning">
        The manifest could not be parsed to hide its sensitive values. Turn on “{REVEAL_LABEL}” to
        display it as stored by Helm.
      </Alert>
    );
  }
  return (
    <CodeBlock
      text={masked.text}
      label="Rendered manifest"
      caption={hiddenCaption(masked.hidden) ?? 'No sensitive value detected.'}
    />
  );
}

/** Secondary content, collapsed and not rendered until the user asks for it. */
function ExtraSection({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      variant="outlined"
    >
      <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" width={22} height={22} />}>
        <Typography variant="subtitle2">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{expanded ? children : null}</AccordionDetails>
    </Accordion>
  );
}

export interface RevisionExplorerProps {
  /** The revision being explored. */
  revision: HelmRevision;
  /** Every revision of the release, the most recent first. */
  revisions: HelmRevision[];
}

/**
 * Values of a revision first; its notes, its manifest and the comparison with another revision
 * stay folded until asked for.
 */
export function RevisionExplorer({ revision, revisions }: RevisionExplorerProps) {
  const [kind, setKind] = useState<ValuesKind>('user');
  const [reveal, setReveal] = useState(false);

  return (
    <SectionBox title={`Revision ${revision.revision}`}>
      <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between">
        <Tabs
          value={kind}
          onChange={(_event, value: ValuesKind) => setKind(value)}
          aria-label={`Values of revision ${revision.revision}`}
          variant="scrollable"
        >
          {VALUES_TABS.map(tab => (
            <Tab key={tab.kind} value={tab.kind} label={tab.label} />
          ))}
        </Tabs>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={reveal}
              onChange={event => setReveal(event.target.checked)}
            />
          }
          label={REVEAL_LABEL}
        />
      </Box>

      <Box py={1}>
        <ValuesPanel revision={revision} kind={kind} reveal={reveal} />
      </Box>

      <Box py={1}>
        <ExtraSection title="Compare values with another revision">
          <CompareValues revision={revision} revisions={revisions} reveal={reveal} />
        </ExtraSection>
        <ExtraSection title="Release notes">
          {revision.notes.trim() === '' ? (
            <Typography variant="body2" color="text.secondary">
              This chart has no release notes.
            </Typography>
          ) : (
            <CodeBlock text={revision.notes} label="Release notes" />
          )}
        </ExtraSection>
        <ExtraSection title="Rendered manifest">
          <ManifestPanel manifest={revision.manifest} reveal={reveal} />
        </ExtraSection>
      </Box>
    </SectionBox>
  );
}
