import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { getPodGroupStatusColor } from '../../utils/status';
import { volcanoRouteNames } from '../../utils/volcanoRoutes';

/**
 * Builds the Progress section for a PodGroup.
 *
 * @param podGroup PodGroup shown in the details page.
 * @returns Section descriptor used by `DetailsGrid`.
 */
function getProgressSection(podGroup: VolcanoPodGroup) {
  const progressPercent = podGroup.gangProgressPercent;

  return {
    id: 'progress',
    section: (
      <SectionBox title="Progress">
        <NameValueTable
          rows={[
            { name: 'Ready Members', value: podGroup.readyMemberCount },
            { name: 'Gang Status', value: podGroup.gangProgressLabel },
            { name: 'Running', value: podGroup.runningCount },
            { name: 'Succeeded', value: podGroup.succeededCount },
            { name: 'Failed', value: podGroup.failedCount },
          ]}
        />
        {progressPercent !== null && (
          <Box sx={{ mt: 2, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Gang progress: {podGroup.readyMemberCount}/{podGroup.minMember} ready
            </Typography>
            <LinearProgress variant="determinate" value={progressPercent} />
          </Box>
        )}
      </SectionBox>
    ),
  };
}

/**
 * Builds the Conditions section for a PodGroup.
 *
 * @param podGroup PodGroup shown in the details page.
 * @returns Section descriptor used by `DetailsGrid`.
 */
function getConditionsSection(podGroup: VolcanoPodGroup) {
  if (!podGroup.status?.conditions?.length) {
    return {
      id: 'conditions',
      section: (
        <SectionBox title="Conditions">
          <NameValueTable
            rows={[
              {
                name: 'Info',
                value: 'No conditions reported by Volcano. Check Events for scheduling details.',
              },
            ]}
          />
        </SectionBox>
      ),
    };
  }

  return {
    id: 'conditions',
    section: (
      <SectionBox title="Conditions">
        {podGroup.status.conditions.map((condition, index) => (
          <NameValueTable
            key={condition.transitionID || `${condition.type}-${index}`}
            rows={[
              { name: 'Type', value: condition.type || '-' },
              { name: 'Status', value: condition.status || '-' },
              { name: 'Reason', value: condition.reason || '-' },
              { name: 'Message', value: condition.message || '-' },
              { name: 'Last Transition', value: condition.lastTransitionTime || '-' },
            ]}
          />
        ))}
      </SectionBox>
    ),
  };
}

/**
 * Builds the Min Resources section for a PodGroup when available.
 *
 * @param podGroup PodGroup shown in the details page.
 * @returns Section descriptor or `null` when no min resources are defined.
 */
function getMinResourcesSection(podGroup: VolcanoPodGroup) {
  if (!podGroup.spec.minResources || !Object.keys(podGroup.spec.minResources).length) return null;

  return {
    id: 'min-resources',
    section: (
      <SectionBox title="Min Resources">
        <NameValueTable
          rows={Object.entries(podGroup.spec.minResources).map(([key, value]) => ({
            name: key,
            value,
          }))}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the Min Task Member section for a PodGroup when available.
 *
 * @param podGroup PodGroup shown in the details page.
 * @returns Section descriptor or `null` when no min task members are defined.
 */
function getMinTaskMemberSection(podGroup: VolcanoPodGroup) {
  if (!podGroup.minTaskMember || !Object.keys(podGroup.minTaskMember).length) {
    return null;
  }

  return {
    id: 'min-task-member',
    section: (
      <SectionBox title="Min Task Member">
        <NameValueTable
          rows={Object.entries(podGroup.minTaskMember).map(([key, value]) => ({
            name: key,
            value,
          }))}
        />
      </SectionBox>
    ),
  };
}

/**
 * Renders the Volcano PodGroup details page.
 *
 * @returns PodGroup details view with extra sections and events.
 */
export default function PodGroupDetail(props: {
  namespace?: string;
  name?: string;
  cluster?: string;
}) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name, cluster } = props;

  return (
    <DetailsGrid
      resourceType={VolcanoPodGroup}
      name={name}
      namespace={namespace}
      cluster={cluster}
      withEvents
      extraInfo={(podGroup: VolcanoPodGroup) =>
        podGroup && [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getPodGroupStatusColor(podGroup.phase)}>
                {podGroup.phase}
              </StatusLabel>
            ),
          },
          {
            name: 'Queue',
            value: (
              <Link routeName={volcanoRouteNames.queueDetail} params={{ name: podGroup.queue }}>
                {podGroup.queue}
              </Link>
            ),
          },
          {
            name: 'Min Member',
            value: podGroup.minMember,
          },
          {
            name: 'Priority Class',
            value: podGroup.spec.priorityClassName || '-',
          },
        ]
      }
      extraSections={(podGroup: VolcanoPodGroup) =>
        podGroup &&
        [
          getProgressSection(podGroup),
          getConditionsSection(podGroup),
          getMinTaskMemberSection(podGroup),
          getMinResourcesSection(podGroup),
        ].filter(Boolean)
      }
    />
  );
}
