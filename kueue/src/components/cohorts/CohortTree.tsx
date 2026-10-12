import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, Typography } from '@mui/material';
import type { CohortTree as CohortTreeData } from '../../resources/cohort';

export interface CohortTreeProps {
  cohort: CohortTreeData;
}

interface CohortTreeNodeProps {
  cohort: CohortTreeData;
  isRoot?: boolean;
}

export function CohortTreeNode({ cohort, isRoot = false }: CohortTreeNodeProps) {
  return (
    <Box sx={{ p: isRoot ? 0 : 1, mt: isRoot ? 0 : 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={isRoot ? 'bold' : 'normal'}>
          {cohort.name}
        </Typography>
        {cohort.parentName && (
          <Chip label={`Parent: ${cohort.parentName}`} size="small" variant="outlined" />
        )}
        {cohort.isCycle && (
          <Chip label="Cycle detected" size="small" color="warning" variant="outlined" />
        )}
      </Box>

      <Box sx={{ pl: 1, mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Participating ClusterQueues ({cohort.members.length}):
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {cohort.members.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              No member ClusterQueues
            </Typography>
          ) : (
            cohort.members.map(member => (
              <Chip
                key={member.name}
                label={member.name}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))
          )}
        </Box>
      </Box>

      {cohort.children && cohort.children.length > 0 && (
        <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider', mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Child Cohorts ({cohort.children.length}):
          </Typography>
          {cohort.children.map(child => (
            <CohortTreeNode key={child.name} cohort={child} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function CohortTreeView({ cohort }: CohortTreeProps) {
  return (
    <SectionBox title={`Cohort Relationship Tree: ${cohort.name}`}>
      <Box sx={{ p: 1 }}>
        <CohortTreeNode cohort={cohort} isRoot />
      </Box>
    </SectionBox>
  );
}
