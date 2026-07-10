import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ClusterQueue } from '../../resources/clusterQueue';

export default function ClusterQueueDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <DetailsGrid
      resourceType={ClusterQueue}
      name={name}
      withEvents
      extraInfo={cq =>
        cq
          ? [
              {
                name: 'Cohort',
                value: cq.cohort,
              },
              {
                name: 'Queueing Strategy',
                value: cq.queueingStrategy,
              },
              {
                name: 'Pending Workloads',
                value: cq.pendingWorkloads,
              },
              {
                name: 'Admitted Workloads',
                value: cq.admittedWorkloads,
              },
            ]
          : []
      }
      extraSections={cq =>
        cq
          ? [
              {
                id: 'kueue-clusterqueue-resource-groups',
                section: (
                  <SectionBox title="Resource Groups">
                    {cq.resourceGroups.length === 0 ? (
                      <Typography variant="body2">No resource groups defined.</Typography>
                    ) : (
                      cq.resourceGroups.map((rg, groupIndex) => (
                        <div key={groupIndex} style={{ marginBottom: '20px' }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Resource Group {groupIndex + 1} (Resources: {rg.coveredResources?.join(', ') || '-'})
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Flavor Name</TableCell>
                                <TableCell>Resource</TableCell>
                                <TableCell>Nominal Quota</TableCell>
                                <TableCell>Borrowing Limit</TableCell>
                                <TableCell>Lending Limit</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rg.flavors?.flatMap(flavor =>
                                flavor.resources?.map((resource, resIndex) => (
                                  <TableRow key={`${flavor.name}-${resource.name}`}>
                                    {resIndex === 0 && (
                                      <TableCell rowSpan={flavor.resources.length} style={{ verticalAlign: 'top' }}>
                                        <Typography variant="body2" fontWeight="bold">
                                          {flavor.name}
                                        </Typography>
                                      </TableCell>
                                    )}
                                    <TableCell>{resource.name}</TableCell>
                                    <TableCell>{resource.nominalQuota}</TableCell>
                                    <TableCell>{resource.borrowingLimit ?? '-'}</TableCell>
                                    <TableCell>{resource.lendingLimit ?? '-'}</TableCell>
                                  </TableRow>
                                ))
                              ) || (
                                <TableRow>
                                  <TableCell colSpan={5}>No flavors configured</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      ))
                    )}
                  </SectionBox>
                ),
              },
            ]
          : []
      }
    />
  );
}
