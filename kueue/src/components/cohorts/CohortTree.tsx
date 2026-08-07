import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, Typography } from '@mui/material';
import { CohortTree as CohortTreeData } from '../../resources/cohort';

export interface CohortTreeProps {
  cohort: CohortTreeData;
}

export function CohortTreeView({ cohort }: CohortTreeProps) {
  return (
    <SectionBox title={`Cohort: ${cohort.name}`}>
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Participating ClusterQueues ({cohort.members.length}):
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {cohort.members.map(member => (
            <Chip
              key={member.name}
              label={member.name}
              color="primary"
              variant="outlined"
              size="medium"
            />
          ))}
        </Box>
      </Box>
    </SectionBox>
  );
}
