import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Topology } from '../../resources/topology';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function TopologyDetail() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={Topology}
      resourceLabel={t('Topologies')}
      verb="get"
      accessDescription={t('Kueue Topologies define node and hardware hierarchy levels for Topology-Aware Scheduling (TAS).')}
    >
      <DetailsGrid
        resourceType={Topology}
        name={name}
        withEvents
        extraInfo={item =>
          item
            ? [
                {
                  name: t('Total Levels'),
                  value: item.levelsCount,
                },
                {
                  name: t('Levels Chain'),
                  value: item.levelsDisplay,
                },
              ]
            : []
        }
        extraSections={item =>
          item && item.levels.length > 0
            ? [
                <SectionBox key="topology-levels" title={t('Topology Levels Hierarchy')}>
                  <Box display="flex" flexDirection="column" gap={2} mt={1}>
                    {item.levels.map((lvl, index) => (
                      <Paper
                        key={lvl.name || index}
                        variant="outlined"
                        sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Chip
                            label={`Level ${index + 1}`}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {lvl.name || t('Unnamed Level')}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            {t('Node Label')}:
                          </Typography>
                          <Chip
                            label={lvl.nodeLabel || t('None')}
                            size="small"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </SectionBox>,
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
