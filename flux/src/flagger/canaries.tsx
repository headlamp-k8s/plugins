import React from 'react';
import { Box } from '@mui/material';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Table, SectionBox, Loader, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Icon } from '@iconify/react';
import CanaryStatus from './canarystatus';
import { DeploymentProgress } from './deploymentprogress';
import FlaggerAvailabilityCheck from './availabilitycheck';

export default function Canaries() {
    const [canary, error] = K8s.ResourceClasses.CustomResourceDefinition.useGet('canaries.flagger.app');
    const canaryResourceClass = React.useMemo(() => {
        return canary?.makeCRClass();
    }, [canary]);

    return (
      <FlaggerAvailabilityCheck>
       {canaryResourceClass ? <CanaryList canaryResourceClass={canaryResourceClass} /> : <Loader />}
      </FlaggerAvailabilityCheck>
    );
}

function CanaryList({ canaryResourceClass }) {
    const [canaries] = canaryResourceClass.useList();
    return (
        <SectionBox title="Canaries">
            <Table
                data={canaries || []}
                columns={[
                    {
                        header: 'Name',
                        accessorKey: 'metadata.name',
                        Cell: ({ row: { original: item } }) => {
                            return (<Link routeName={`/flux/flagger/canaries/:namespace/:name`} params={{
                                name: item.metadata.name,
                                namespace: item.metadata.namespace,
                            }}>
                                <Box alignItems="center" display="flex"><Box mr={0.5}>{item.metadata.name}</Box>
                                <Icon icon="mdi:bird" color="#fff200" width={"20"}/></Box>
                            </Link>)
                        },
                    },
                    {
                      header: 'Status',
                      // status is determined from the conditions array in status
                      accessorKey: 'status.phase',
                      Cell: ({ row: { original: item } }) => (
                        <CanaryStatus status={item.status ? item['status.phase'] : 'Unknown'} />
                      ),
                    },
                    {
                        header: 'Namespace',
                        accessorKey: 'metadata.namespace',
                        Cell: ({ row: { original: item } }) => (
                            <Link routeName={'namespace'} params={{ name: item.metadata.namespace }}>
                                {item.metadata.namespace}
                            </Link>
                        ),
                    },
                    {
                        header: 'Target',
                        accessorKey: 'spec.targetRef.name',
                        Cell: ({ row: { original: item } }) => {
                            console.log(item);
                          //@ts-ignore
                           const resource = item.jsonData;
                          return (
                            resource?.spec?.targetRef.name
                        )},
                    },
                    {
                      header: 'Progress',
                      Cell: ({ row: { original: item } }) => (
                        <DeploymentProgress canary={item?.jsonData} />
                      )
                    },
                    {
                      header: 'Service',
                      accessorKey: 'spec.service.port',
                      Cell: ({ row: { original: item } }) => (
                        <pre>{JSON.stringify(item?.jsonData.spec.service, null, 2)}</pre>
                      ),
                    },
                    {
                      header: 'MaxWeight',
                      accessorKey: 'spec.analysis.maxWeight',
                      Cell: ({row: {original: item}}) => (
                        item.jsonData.spec.analysis.maxWeight
                      )
                    },
                    {
                      header: 'StepWeight',
                      accessorKey: 'spec.analysis.stepWeight',
                      Cell: ({row: {original: item}}) => (
                        item.jsonData.spec.analysis.stepWeight
                      )
                    }, {
                      header: 'Threshold',
                      accessorKey: 'spec.analysis.threshold',
                      Cell: ({row: {original: item}}) => (
                        item?.jsonData.spec.analysis.threshold
                      )
                    },
                    {
                      header: 'Interval',
                      accessorKey: 'spec.analysis.interval',
                      Cell: ({row: {original: item}}) => (
                        item?.jsonData.spec.analysis.interval
                      )
                    }
                ]}
            />
        </SectionBox>
    );
}
