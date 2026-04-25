import {
  HoverInfoLabel,
  Link,
  SectionBox,
  SectionFilterHeader,
  ShowHideLabel,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { localeDate, timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';
import { PendingPod } from './Events';

export const PendingPodsRenderer = (props: { pods?: PendingPod[] }) => {
  const { pods } = props;
  if (!pods) {
    return <></>;
  }

  return (
    <>
      <SectionBox title={<SectionFilterHeader title={'Pending Pods'} noNamespaceFilter />}>
        <Table
          columns={[
            {
              id: 'name',
              header: 'Name',
              accessorFn: item => (
                <Link
                  routeName="Pod"
                  params={{
                    name: item.name,
                    namespace: item.namespace,
                  }}
                >
                  {item.name}
                </Link>
              ),
            },
            {
              header: 'Namespace',
              accessorFn: item => (
                <Link
                  routeName="namespace"
                  params={{
                    name: item.namespace,
                  }}
                >
                  {item.namespace}
                </Link>
              ),
            },
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
                return item.source;
              },
            },
            {
              header: 'Message',
              accessorFn: item => {
                return (
                  item && (
                    <ShowHideLabel labelId={`${item?.id}-message`}>
                      {item.message ?? ''}
                    </ShowHideLabel>
                  )
                );
              },
            },
            {
              id: 'age',
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
              gridTemplate: 'min-content',
              muiTableBodyCellProps: {
                align: 'right',
              },
            },
          ]}
          data={pods}
          initialState={{
            sorting: [
              {
                id: 'name',
                desc: false,
              },
            ],
          }}
        />
      </SectionBox>
    </>
  );
};
