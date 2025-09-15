import './loader.css';
import { Icon } from '@iconify/react';
import {
  registerDetailsViewHeaderAction,
  registerDetailsViewSectionsProcessor,
  registerPluginSettings,
  registerResourceTableColumnsProcessor,
} from '@kinvolk/headlamp-plugin/lib';
import { ResourceTableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import type Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import type Node from '@kinvolk/headlamp-plugin/lib/K8s/node';
import type Pod from '@kinvolk/headlamp-plugin/lib/K8s/pod';
import type Service from '@kinvolk/headlamp-plugin/lib/K8s/service';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { OpencostDetailSection } from './detail';
import { fetchOpencostData } from './request';
import { Settings } from './settings';
import { getConfigStore, getDisplayCurrency, getDisplayTimespan, getServiceDetails } from './utils';

function IconAction() {
  const handleClick = event => {
    event.preventDefault();
    const targetElement = document.getElementById('opencost-plugin-cost-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'auto' });
    }
  };

  return (
    <Tooltip title={'Cost'}>
      <IconButton onClick={handleClick} aria-label={'Cost'} aria-haspopup="true">
        <Icon icon="mdi:cash-register" />
      </IconButton>
    </Tooltip>
  );
}

registerDetailsViewHeaderAction(IconAction);

registerPluginSettings('@headlamp-k8s/opencost', Settings, true);

registerDetailsViewSectionsProcessor(function addSubheaderSection(resource, sections) {
  if (
    resource?.kind === 'Pod' ||
    resource?.kind === 'Node' ||
    resource?.kind === 'Namespace' ||
    resource?.kind === 'Service' ||
    resource?.kind === 'Deployment'
  ) {
    sections.push({
      id: 'Opencost-' + resource.kind,
      section: <OpencostDetailSection resource={resource} type={resource?.kind.toLowerCase()} />,
    });
  }

  return sections;
});

const acceptedList = [
  'headlamp-pods',
  'headlamp-nodes',
  'headlamp-namespaces',
  'headlamp-services',
  'headlamp-deployments',
];

type AcceptedTypes = Pod | Node | Namespace | Service | Deployment;

function resourceTypeFromId(id: string) {
  switch (id) {
    case 'headlamp-pods':
      return 'pod';
    case 'headlamp-nodes':
      return 'node';
    case 'headlamp-namespaces':
      return 'namespace';
    case 'headlamp-services':
      return 'service';
    case 'headlamp-deployments':
      return 'deployment';
    default:
      return '';
  }
}

let openCostDataCache = null;

const useOpenCostData = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean | null>(null);
  const [resourceType, setResourceType] = useState('');

  useEffect(() => {
    if (resourceType === '') {
      return;
    }
    setIsLoading(true);
    const fetchData = async () => {
      const [namespace, serviceName] = await getServiceDetails();
      const result = await fetchOpencostData(
        namespace,
        serviceName,
        getDisplayTimespan(),
        resourceType,
        true
      );
      openCostDataCache = result;
      setData(result);
      setIsLoading(false);
    };

    fetchData();
  }, [resourceType]);

  return { data, isLoading, sharedResourceType: resourceType, setResourceType };
};

const useSharedData = () => useBetween(useOpenCostData);

function OpenCostData(props: { resource; resourceType }) {
  const { resource, resourceType } = props;
  const { data, isLoading, sharedResourceType, setResourceType } = useSharedData();

  if (resourceType !== sharedResourceType && (isLoading === null || isLoading === false)) {
    setResourceType(resourceType);
  } else if (isLoading) {
    return <>{`...`}</>;
  } else {
    const totalCost = data?.data[0]?.[resource.jsonData?.metadata?.name]?.totalCost ?? 0;
    return <>{totalCost ? `${getDisplayCurrency()} ${totalCost}` : 'N/A'}</>;
  }
}

function getCost(value): number {
  return typeof value === 'number' && !isNaN(value) ? value : 0;
}

registerResourceTableColumnsProcessor(function processor({ id, columns }) {
  const configStore = getConfigStore();
  const conf = configStore.get();

  if ((conf?.isEnabledInListView ?? true) && acceptedList.includes(id)) {
    const filteredColumns = (columns as ResourceTableColumn<AcceptedTypes>[]).filter(
      col => col.id !== 'opencost'
    );
    const column = {
      id: 'opencost',
      label: `Cost (${getDisplayTimespan()})`,
      render: resource => {
        return <OpenCostData resource={resource} resourceType={resourceTypeFromId(id)} />;
      },
      sort: (a, b) => {
        const totalCostA = getCost(
          openCostDataCache?.data[0]?.[a.jsonData?.metadata?.name]?.totalCost
        );
        const totalCostB = getCost(
          openCostDataCache?.data[0]?.[b.jsonData?.metadata?.name]?.totalCost
        );
        return totalCostA - totalCostB;
      },
      disableFiltering: true,
      show: true,
    } as unknown as ResourceTableColumn<AcceptedTypes>;
    filteredColumns.splice(filteredColumns.length - 1, 0, column);

    return filteredColumns as typeof columns;
  }
  return columns;
});
