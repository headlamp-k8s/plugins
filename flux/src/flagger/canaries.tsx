import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  DateLabel,
  Link,
  Loader,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import React from 'react';
import FlaggerAvailabilityCheck, { useCanary } from './availabilitycheck';
import CanaryStatus from './canarystatus';
import { DeploymentProgress } from './deploymentprogress';

export default function Canaries() {
  const [canary] = useCanary();
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
  const [deployments] = K8s.ResourceClasses.Deployment.useList();

  // Calculate pod counts for canary and primary deployments
  const canariesWithPodCounts: [
    {
      canaryPodCount: number;
      primaryPodCount: number;
      hasAbTesting: boolean;
      abHeaders: string;
      abCookies: string;
    } & K8s.CustomResource
  ] = React.useMemo(() => {
    if (!canaries || !deployments) return null;
    return canaries.map(canary => {
      const targetName = canary?.jsonData?.spec?.targetRef?.name;
      const namespace = canary?.jsonData?.metadata?.namespace;

      // Find the original canary deployment
      const canaryDeployment = deployments.find(
        d => d.jsonData.metadata.name === targetName && d.jsonData.metadata.namespace === namespace
      );
      // Find the primary deployment (with -primary suffix)
      const primaryDeployment = deployments.find(
        d =>
          d.jsonData.metadata.name === `${targetName}-primary` &&
          d.jsonData.metadata.namespace === namespace
      );

      const abTesting = canary?.jsonData?.spec?.service?.match || [];
      // Check if A/B testing is enabled
      const hasAbTesting = abTesting.length > 0;

      // Format A/B testing headers or cookies
      const abHeaders = abTesting
        .filter(match => match.headers)
        .map(match => Object.keys(match.headers)[0])
        .join(', ');

      const abCookies = abTesting
        .filter(match => match.cookies)
        .map(match => Object.keys(match.cookies)[0])
        .join(', ');

      return {
        ...canary.jsonData,
        canaryPodCount: canaryDeployment?.status?.readyReplicas || 0,
        primaryPodCount: primaryDeployment?.status?.readyReplicas || 0,
        hasAbTesting,
        abHeaders,
        abCookies,
      };
    });
  }, [canaries, deployments]);

  return (
    <SectionBox title="Canaries">
      <Table
        data={canariesWithPodCounts}
        columns={[
          {
            header: 'Name',
            accessorKey: 'metadata.name',
            Cell: ({ row: { original: item } }) => {
              return (
                <Link
                  routeName={`/flux/flagger/canaries/:namespace/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  <Box alignItems="center" display="flex">
                    <Box mr={0.5}>{item.metadata.name}</Box>
                    <Icon icon="mdi:bird" color="#fff200" width={'20'} />
                  </Box>
                </Link>
              );
            },
          },
          {
            header: 'Status',
            accessorKey: 'status.phase',
            Cell: ({ row: { original: item } }) => {
              // Correctly extract the phase from the status object
              const phase = item?.status?.phase || 'Unknown';
              return <CanaryStatus status={phase} />;
            },
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
              const kind = item?.spec?.targetRef?.kind;
              const namespace = item?.spec?.targetRef?.namespace || item?.metadata?.namespace;
              const name = item?.spec?.targetRef?.name;
              return (
                <Link routeName={`${kind.toLowerCase()}`} params={{ name, namespace }}>
                  {name}
                </Link>
              );
            },
          },
          {
            header: 'Progress',
            Cell: ({ row: { original: item } }) => <DeploymentProgress canary={item} />,
          },
          {
            header: 'Canary Pods',
            Cell: ({ row: { original: item } }) => item?.canaryPodCount || 0,
          },
          {
            header: 'Primary Pods',
            Cell: ({ row: { original: item } }) => item?.primaryPodCount || 0,
          },
          {
            header: 'A/B Testing',
            Cell: ({ row: { original: item } }) =>
              item?.hasAbTesting ? (
                <Box display="flex" alignItems="center">
                  <Icon icon="mdi:check" color="#4caf50" width="20" />
                </Box>
              ) : (
                <Box display="flex" alignItems="center">
                  <Icon icon="mdi:close" color="#f44336" width="20" />
                </Box>
              ),
          },
          {
            header: 'A/B Headers',
            Cell: ({ row: { original: item } }) => item?.abHeaders || '-',
          },
          {
            header: 'A/B Cookies',
            Cell: ({ row: { original: item } }) => item?.abCookies || '-',
          },
          {
            header: 'Configuration',
            Cell: ({ row: { original: item } }) => (
              <Box>
                <Box>Max Weight: {item.spec.analysis.maxWeight}</Box>
                <Box>Step Weight: {item.spec.analysis.stepWeight}</Box>
                <Box>Threshold: {item.spec.analysis.threshold}</Box>
                <Box>Interval: {item.spec.analysis.interval}</Box>
              </Box>
            ),
          },
          {
            header: 'Age',
            accessorKey: 'metadata.creationTimestamp',
            Cell: ({ row: { original: item } }) => {
              return <DateLabel date={item.metadata.creationTimestamp} />;
            },
          },
        ]}
      />
    </SectionBox>
  );
}
