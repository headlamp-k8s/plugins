import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { BmcJob } from '../../../resources/bmcJob';
import { fallback, renderUnknownValue } from '../../common/detailHelpers';
import type { TinkerbellDetailProps } from '../../common/detailTypes';

/**
 * Renders the Tinkerbell BMC Job detail view.
 *
 * @returns BMC Job detail page with machine reference, tasks, and timing.
 */
export function BmcJobDetail(props: TinkerbellDetailProps = {}) {
  const params = useParams<{ namespace: string; name: string }>();
  const namespace = props.namespace ?? params.namespace;
  const name = props.name ?? params.name;

  return (
    <DetailsGrid
      resourceType={BmcJob}
      name={name}
      namespace={namespace}
      cluster={props.cluster}
      extraInfo={item =>
        item
          ? [
              { name: 'Machine', value: fallback(item.spec?.machineRef?.name) },
              { name: 'Tasks', value: fallback(item.spec?.tasks?.length) },
              { name: 'Started', value: fallback(item.status?.startTime) },
              { name: 'Completed', value: fallback(item.status?.completionTime) },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'tinkerbell.bmc-job-machine-ref',
                section: (
                  <SectionBox title="Machine Reference">
                    <NameValueTable
                      rows={[
                        { name: 'Name', value: fallback(item.spec?.machineRef?.name) },
                        { name: 'Namespace', value: fallback(item.spec?.machineRef?.namespace) },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.bmc-job-tasks',
                section: (
                  <SectionBox title="Tasks">
                    <SimpleTable
                      columns={[
                        { label: 'Index', getter: row => fallback(row.index) },
                        { label: 'Task', getter: row => renderUnknownValue(row.task) },
                      ]}
                      data={(item.spec?.tasks ?? []).map((task, index) => ({
                        index: index + 1,
                        task,
                      }))}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.bmc-job-timing',
                section: (
                  <SectionBox title="Timing">
                    <NameValueTable
                      rows={[
                        { name: 'Started', value: fallback(item.status?.startTime) },
                        { name: 'Completed', value: fallback(item.status?.completionTime) },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.bmc-job-conditions',
                section: <ConditionsSection resource={item.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}
