import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation();
  if (!pods) {
    return <></>;
  }

  return (
    <>
      <SectionBox title={<SectionFilterHeader title={t('Pending Pods')} noNamespaceFilter />}>
        <Table
          columns={[
            {
              id: 'name',
              header: t('Name'),
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
              header: t('Namespace'),
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
              header: t('Type'),
              accessorFn: item => {
                return item.type;
              },
            },
            {
              header: t('Reason'),
              accessorFn: item => {
                return item.reason;
              },
            },
            {
              header: t('From'),
              accessorFn: item => {
                return item.source;
              },
            },
            {
              header: t('Message'),
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
              header: t('Age'),
              accessorFn: item => {
                if (item.count > 1) {
                  return t('{{last}} ({{count}} times over {{first}})', {
                    last: timeAgo(item.lastOccurrence),
                    count: item.count,
                    first: timeAgo(item.firstOccurrence),
                  });
                }
                const label = timeAgo(item.lastOccurrence, { format: 'mini' });
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
