import { DetailsGrid, Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ActionButton, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { Workload } from '../../resources/workload';
import { kueueRouteNames } from '../../utils/kueueRoutes';

export default function WorkloadDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const handleActiveToggle = async (wl: Workload, nextActiveState: boolean) => {
    try {
      await wl.patch({
        spec: {
          active: nextActiveState,
        },
      });
      const actionName = nextActiveState ? 'resumed' : 'suspended';
      enqueueSnackbar(`Successfully ${actionName} workload ${wl.metadata.name}`, {
        variant: 'success',
      });
    } catch (err: any) {
      enqueueSnackbar(`Failed to update workload state: ${err.message || err}`, {
        variant: 'error',
      });
    }
  };

  return (
    <DetailsGrid
      resourceType={Workload}
      name={name}
      namespace={namespace}
      withEvents
      actions={wl => {
        if (!wl) return [];
        return [
          wl.isActive ? (
            <ActionButton
              key="suspend"
              description="Suspend"
              icon="mdi:pause"
              onClick={() => handleActiveToggle(wl, false)}
            />
          ) : (
            <ActionButton
              key="resume"
              description="Resume"
              icon="mdi:play"
              onClick={() => handleActiveToggle(wl, true)}
            />
          ),
        ];
      }}
      extraInfo={wl =>
        wl
          ? [
              {
                name: 'LocalQueue',
                value: wl.queueName && wl.queueName !== '-' ? (
                  <Link
                    routeName={kueueRouteNames.localQueueDetail}
                    params={{ name: wl.queueName, namespace: wl.metadata.namespace }}
                  >
                    {wl.queueName}
                  </Link>
                ) : (
                  '-'
                ),
              },
              {
                name: 'Priority',
                value: wl.priority,
              },
              {
                name: 'Priority Class',
                value: wl.priorityClassName,
              },
              {
                name: 'Active',
                value: wl.isActive ? 'Yes' : 'No',
              },
              {
                name: 'Status',
                value: wl.statusMessage,
              },
            ]
          : []
      }
      extraSections={wl =>
        wl
          ? [
              {
                id: 'kueue-workload-podsets',
                section: (
                  <SectionBox title="Pod Sets">
                    {wl.podSets.length === 0 ? (
                      <Typography variant="body2">No pod sets defined.</Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Containers & Resource Requests</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wl.podSets.map((podSet, idx) => (
                            <TableRow key={`${podSet.name}-${idx}`}>
                              <TableCell style={{ fontWeight: 'bold' }}>{podSet.name}</TableCell>
                              <TableCell>{podSet.count}</TableCell>
                              <TableCell>
                                {podSet.template?.spec?.containers?.map((c, cIdx) => (
                                  <div key={`${c.name}-${cIdx}`} style={{ marginBottom: '4px' }}>
                                    <Typography variant="body2" component="span" fontWeight="bold">
                                      {c.name}
                                    </Typography>
                                    {c.image && ` (${c.image})`}
                                    {c.resources?.requests && (
                                      <div style={{ paddingLeft: '8px', color: 'gray', fontSize: '0.85rem' }}>
                                        Requests: {Object.entries(c.resources.requests)
                                          .map(([key, val]) => `${key}: ${val}`)
                                          .join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </SectionBox>
                ),
              },
              ...(wl.admission
                ? [
                    {
                      id: 'kueue-workload-admission',
                      section: (
                        <SectionBox title="Admission Details">
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell style={{ fontWeight: 'bold', width: '200px' }}>
                                  Admitted ClusterQueue
                                </TableCell>
                                <TableCell>
                                  <Link
                                    routeName={kueueRouteNames.clusterQueueDetail}
                                    params={{ name: wl.admission.clusterQueue }}
                                  >
                                    {wl.admission.clusterQueue}
                                  </Link>
                                </TableCell>
                              </TableRow>
                              {wl.admission.podSetFlavors && wl.admission.podSetFlavors.length > 0 && (
                                <TableRow>
                                  <TableCell style={{ fontWeight: 'bold' }}>
                                    Assigned Flavors
                                  </TableCell>
                                  <TableCell>
                                    {wl.admission.podSetFlavors.map((psf, fIdx) => (
                                      <div key={`${psf.name}-${fIdx}`} style={{ marginBottom: '4px' }}>
                                        <Typography variant="body2" component="span" fontWeight="bold">
                                          {psf.name}
                                        </Typography>
                                        {psf.flavors && (
                                          <span style={{ color: 'gray', marginLeft: '8px' }}>
                                            ({Object.entries(psf.flavors)
                                              .map(([res, flav]) => `${res} -> ${flav}`)
                                              .join(', ')})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </SectionBox>
                      ),
                    },
                  ]
                : []),
            ]
          : []
      }
    />
  );
}
