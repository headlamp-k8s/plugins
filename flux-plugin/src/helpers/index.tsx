import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  HoverInfoLabel,
  Link,
  SectionBox,
  ShowHideLabel,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { localeDate, timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';

export function getSourceNameAndType(item: KubeObject) {
  const itemKind = item.jsonData.kind;
  let type = '';
  let name = '';
  if (itemKind === 'Kustomization') {
    switch (item.jsonData.spec.sourceRef.kind) {
      case 'GitRepository':
        type = 'gitrepositories';
        break;
      case 'OCIRepository':
        type = 'ocirepositories';
        break;
      case 'Bucket':
        type = 'buckets';
        break;
    }
    name = item.jsonData.spec?.sourceRef?.name;
  } else if (itemKind === 'HelmRelease') {
    switch (item?.jsonData?.spec?.chartRef?.kind) {
      case 'GitRepository':
        type = 'gitrepositories';
        break;
      case 'OCIRepository':
        type = 'ocirepositories';
        break;
      case 'Bucket':
        type = 'buckets';
        break;
    }
    if (item?.jsonData?.spec?.chartRef) {
      name = item?.jsonData?.spec?.chartRef?.name;
    }
    switch (item?.jsonData?.spec?.chart?.spec?.sourceRef?.kind) {
      case 'GitRepository':
        type = 'gitrepositories';
        break;
      case 'OCIRepository':
        type = 'ocirepositories';
        break;
      case 'Bucket':
        type = 'buckets';
        break;
      case 'HelmRepository':
        type = 'helmrepositories';
        break;
      case 'HelmChart':
        type = 'helmcharts';
        break;
    }
    if (item?.jsonData?.spec?.chart?.spec?.sourceRef) {
      name = item?.jsonData?.spec?.chart?.spec?.sourceRef?.name;
    }
  }
  return { name, type };
}

export function ObjectEvents(props: { events: any }) {
  const { events } = props;
  if (!events) {
    return null;
  }
  return (
    <SectionBox title={'Events'}>
      <Table
        defaultSortingColumn={4}
        columns={[
          {
            header: 'Type',
            accessorFn: item => {
              return item.type;
            },
          },
          {
            header: 'Reason',
            accessorFn: item => {
              return item.reason;
            },
          },
          {
            header: 'From',
            accessorFn: item => {
              return item.source.component;
            },
          },
          {
            header: 'Message',
            accessorFn: item => {
              return (
                item && (
                  <ShowHideLabel labelId={item?.metadata?.uid || ''}>
                    {item.message || ''}
                  </ShowHideLabel>
                )
              );
            },
          },
          {
            id: 'Age',
            header: 'Age',
            accessorFn: item => {
              if (item.count > 1) {
                return `${timeAgo(item.lastOccurrence)} (${item.count} times over ${timeAgo(
                  item.firstOccurrence
                )})`;
              }
              const eventDate = timeAgo(item.lastOccurrence, { format: 'mini' });
              let label: string;
              if (item.count > 1) {
                label = `${eventDate} ${item.count} times since ${timeAgo(item.firstOccurrence)}`;
              } else {
                label = eventDate;
              }

              return (
                <HoverInfoLabel
                  label={label}
                  hoverInfo={localeDate(item.lastOccurrence)}
                  icon="mdi:calendar"
                />
              );
            },
            sortingFn: (rowA, rowB) => {
              return (
                new Date(rowB.lastTimestamp).getTime() - new Date(rowA.lastTimestamp).getTime()
              );
            },
          },
        ]}
        data={events}
        initialState={{
          sorting: [
            {
              id: 'Age',
              desc: false,
            },
          ],
        }}
      />
    </SectionBox>
  );
}

export function prepareNameLink(item) {
  const kind = item.kind;
  const resourceKind = K8s.ResourceClasses[kind];
  console.log('item', item);
  if (
    kind === 'GitRepository' ||
    kind === 'OCIRepository' ||
    kind === 'HelmRepository' ||
    kind === 'Bucket' ||
    kind === 'HelmChart' ||
    kind === 'Kustomization' ||
    kind === 'HelmRelease'
  ) {
    // prepare link
    return item.metadata.name;
  }
  if (resourceKind) {
    const resource = new resourceKind(item);
    if (resource && resource?.getDetailsLink && resource.getDetailsLink()) {
      return <Link kubeObject={resource}>{item.metadata.name}</Link>;
    }
    return item.metadata.name;
  }

  return item.metadata.name;
}

export function parseDuration(duration) {
  const regex = /(\d+)([hms])/g; // Match numbers followed by h, m, or s
  let totalMilliseconds = 0;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        totalMilliseconds += value * 60 * 60 * 1000; // Convert hours to milliseconds
        break;
      case 'm':
        totalMilliseconds += value * 60 * 1000; // Convert minutes to milliseconds
        break;
      case 's':
        totalMilliseconds += value * 1000; // Convert seconds to milliseconds
        break;
    }
  }

  return totalMilliseconds;
}

export function prepareTimePassedString(timeStampStr, durationStr) {
  const pastTimestamp = new Date(timeStampStr);

  // Parse the duration to milliseconds
  const durationInMillis = parseDuration(durationStr);

  // Calculate the future timestamp by adding the duration
  const futureTimestamp = new Date(pastTimestamp.getTime() + durationInMillis);

  // Get the current time in UTC
  const now = new Date();

  // Calculate the time remaining until the future timestamp
  let timeRemaining = now.getTime() - futureTimestamp.getTime(); // in milliseconds
  if (timeRemaining < 0) {
    timeRemaining = futureTimestamp.getTime() - now.getTime();
  }
  const seconds = Math.floor((timeRemaining / 1000) % 60);
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}
