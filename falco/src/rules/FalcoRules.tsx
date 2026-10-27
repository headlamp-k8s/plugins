import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import RulesTable from '../common/RulesTable';
import LoadingIndicator from '../components/LoadingIndicator';
import { FalcoRulesService } from '../services/falcoRulesService';
import { FalcoRule, FalcoRuleWithPodFile } from '../types/FalcoRule';
import { splitSource } from '../utils/falcoRulesUtils';

/**
 * The main FalcoRules component.
 * @returns The FalcoRules component.
 */
export default function FalcoRules() {
  const [rules, setRules] = React.useState<FalcoRule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Search across the rule's name/description/pod/file fields so the header
  // search box wired up by `SectionFilterHeader` actually filters the table.
  const filterFunction = useFilterFunc<FalcoRuleWithPodFile>(['.name', '.desc', '.pod', '.file']);

  // Memoized rules with pod/file split
  const rulesWithPodFile: FalcoRuleWithPodFile[] = React.useMemo(
    () => rules.map(r => ({ ...r, ...splitSource(r.source) })),
    [rules]
  );

  // Fetch rules on component mount
  React.useEffect(() => {
    let cancelled = false;

    async function fetchRules() {
      if (cancelled) return;

      setLoading(true);
      setError(null);

      try {
        const allRules = await FalcoRulesService.fetchAllRules();
        if (!cancelled) {
          setRules(allRules);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          let msg = '';
          if (
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof (err as any).message === 'string'
          ) {
            msg = (err as any).message;
          } else if (typeof err === 'string') {
            msg = err;
          }
          setError('Failed to fetch Falco rules: ' + msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRules();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionBox title={<SectionFilterHeader title="Falco Rules" noNamespaceFilter />}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          This table lists all Falco rules loaded in the cluster. (Editing and management coming
          soon.)
        </Typography>
      </Box>

      <LoadingIndicator loading={loading} error={error} />
      <RulesTable data={rulesWithPodFile} filterFunction={filterFunction} />
    </SectionBox>
  );
}
