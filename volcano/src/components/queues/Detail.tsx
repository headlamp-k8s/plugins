import {
  ActionButton,
  AuthVisible,
  DetailsGrid,
  Dialog,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  createQueueCommand,
  QUEUE_COMMAND_NAMESPACE,
  VolcanoCommand,
  VolcanoQueueCommandAction,
} from '../../resources/command';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { VolcanoQueue } from '../../resources/queue';
import { getQueueStatusColor } from '../../utils/status';
import { getQueuePodGroupStats, type QueuePodGroupStats } from './stats';

interface QueueCommandActionButtonProps {
  queue: VolcanoQueue;
  label: string;
  icon: string;
  action: VolcanoQueueCommandAction;
  successMessage: string;
  longDescription?: string;
}

/**
 * Renders a queue action button that issues an open or close command.
 *
 * @param props Queue command button properties.
 * @returns Queue command action button.
 */
function QueueCommandActionButton({
  queue,
  label,
  icon,
  action,
  successMessage,
  longDescription,
}: QueueCommandActionButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClick = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createQueueCommand(queue, action);
      enqueueSnackbar(successMessage, { variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      enqueueSnackbar(`Failed to ${label.toLowerCase()} queue ${queue.metadata.name}: ${message}`, {
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ActionButton
      description={label}
      longDescription={longDescription}
      icon={icon}
      onClick={onClick}
      iconButtonProps={{ disabled: isSubmitting }}
    />
  );
}

/**
 * Renders the action button and dialog used to update queue weight.
 *
 * @param props Queue weight action button properties.
 * @returns Queue weight update action button and dialog.
 */
function UpdateQueueWeightActionButton({ queue }: { queue: VolcanoQueue }) {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightValue, setWeightValue] = useState(String(queue.weight));

  const parsedWeight = Number(weightValue);
  const isWeightValid = Number.isInteger(parsedWeight) && parsedWeight > 0;

  const submit = async () => {
    if (!isWeightValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await queue.patch({
        spec: {
          weight: parsedWeight,
        },
      });
      enqueueSnackbar(`Updated queue weight for ${queue.metadata.name}.`, { variant: 'success' });
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      enqueueSnackbar(`Failed to update queue weight for ${queue.metadata.name}: ${message}`, {
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ActionButton
        description="Update Weight"
        longDescription="Update queue weight (vcctl queue operate -a update -w <weight>)."
        icon="mdi:tune"
        onClick={() => {
          setWeightValue(String(queue.weight));
          setOpen(true);
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="Update Queue Weight">
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Weight"
            type="number"
            value={weightValue}
            onChange={event => setWeightValue(event.target.value)}
            inputProps={{ min: 1, step: 1 }}
            error={weightValue.length > 0 && !isWeightValid}
            helperText={
              weightValue.length > 0 && !isWeightValid
                ? 'Weight must be an integer greater than 0.'
                : ' '
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting || !isWeightValid}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * Builds the queue header action buttons shown in the details view.
 *
 * @param queue Queue shown in the details page.
 * @returns Queue actions for open, close, and weight update.
 */
function getQueueActionButtons(queue: VolcanoQueue) {
  const canOpen = queue.state !== 'Open';
  const canClose = queue.state === 'Open' && queue.getName() !== 'root';

  return [
    ...(canOpen
      ? [
          {
            id: 'volcano-queue-open',
            action: (
              <AuthVisible
                item={VolcanoCommand}
                authVerb="create"
                namespace={QUEUE_COMMAND_NAMESPACE}
              >
                <QueueCommandActionButton
                  queue={queue}
                  label="Open"
                  longDescription="Open this queue (vcctl queue operate -a open)."
                  icon="mdi:lock-open-variant-outline"
                  action="OpenQueue"
                  successMessage={`Open command created for ${queue.metadata.name}`}
                />
              </AuthVisible>
            ),
          },
        ]
      : []),
    ...(canClose
      ? [
          {
            id: 'volcano-queue-close',
            action: (
              <AuthVisible
                item={VolcanoCommand}
                authVerb="create"
                namespace={QUEUE_COMMAND_NAMESPACE}
              >
                <QueueCommandActionButton
                  queue={queue}
                  label="Close"
                  longDescription="Close this queue (vcctl queue operate -a close)."
                  icon="mdi:lock-outline"
                  action="CloseQueue"
                  successMessage={`Close command created for ${queue.metadata.name}`}
                />
              </AuthVisible>
            ),
          },
        ]
      : []),
    {
      id: 'volcano-queue-update-weight',
      action: (
        <AuthVisible item={queue} authVerb="update">
          <UpdateQueueWeightActionButton queue={queue} />
        </AuthVisible>
      ),
    },
  ];
}

/**
 * Builds the capacity and allocated resources section for a Queue.
 *
 * @param queue Queue shown in the details page.
 * @returns Section descriptor or `null` when no resource data is available.
 */
function getCapacityAllocatedSection(queue: VolcanoQueue) {
  const capacity = queue.spec.capability || {};
  const allocated = queue.status?.allocated || {};
  const resourceKeys = Array.from(new Set([...Object.keys(capacity), ...Object.keys(allocated)]));
  const resourceRows = resourceKeys.map(resource => ({ resource }));

  if (!resourceKeys.length) {
    return null;
  }

  return {
    id: 'capacity-allocated',
    section: (
      <SectionBox title="Capacity and Allocated Resources">
        <SimpleTable
          data={resourceRows}
          columns={[
            {
              label: 'Resource',
              getter: (row: { resource: string }) => row.resource,
              sort: true,
            },
            {
              label: 'Capacity',
              getter: (row: { resource: string }) => capacity[row.resource] ?? '-',
            },
            {
              label: 'Allocated',
              getter: (row: { resource: string }) => allocated[row.resource] ?? '-',
            },
          ]}
          showPagination={false}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the queue status section from PodGroup-derived counters.
 *
 * @param queueName Queue name used to look up counters.
 * @param queuePodGroupStats Queue counters keyed by queue name.
 * @returns Queue status section descriptor.
 */
function getQueueStatusSection(
  queueName: string,
  queuePodGroupStats: Record<string, QueuePodGroupStats>
) {
  const stats = queuePodGroupStats[queueName] || {
    inqueue: 0,
    pending: 0,
    running: 0,
    unknown: 0,
    completed: 0,
  };

  return {
    id: 'queue-status',
    section: (
      <SectionBox title="Queue Status">
        <NameValueTable
          rows={[
            { name: 'Inqueue', value: stats.inqueue },
            { name: 'Pending', value: stats.pending },
            { name: 'Running', value: stats.running },
            { name: 'Unknown', value: stats.unknown },
            { name: 'Completed', value: stats.completed },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the deserved and guarantee resources section for a Queue.
 *
 * @param queue Queue shown in the details page.
 * @returns Section descriptor for deserved and guarantee resources.
 */
function getDeservedGuaranteeSection(queue: VolcanoQueue) {
  const deservedResources = queue.deservedResources || {};
  const configuredResources = queue.guaranteedResources || {};
  const resourceKeys = Array.from(
    new Set([...Object.keys(deservedResources), ...Object.keys(configuredResources)])
  );
  const resourceRows = resourceKeys.length ? resourceKeys.map(resource => ({ resource })) : [];

  return {
    id: 'deserved-guarantee',
    section: (
      <SectionBox title="Deserved and Guaranteed Resources">
        <SimpleTable
          data={resourceRows.length ? resourceRows : [{ resource: 'Resources' }]}
          columns={[
            {
              label: 'Resource',
              getter: (row: { resource: string }) => row.resource,
              sort: true,
            },
            {
              label: 'Deserved',
              getter: (row: { resource: string }) => deservedResources[row.resource] ?? '-',
            },
            {
              label: 'Guarantee',
              getter: (row: { resource: string }) => configuredResources[row.resource] ?? '-',
            },
          ]}
          showPagination={false}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the reservation section for a Queue.
 *
 * @param queue Queue shown in the details page.
 * @returns Reservation section descriptor.
 */
function getReservationSection(queue: VolcanoQueue) {
  const runtimeResources = queue.reservedResources || {};
  const reservedNodes = queue.reservedNodes;
  const resourceKeys = Object.keys(runtimeResources);

  return {
    id: 'reservation',
    section: (
      <SectionBox title="Reservation">
        <NameValueTable
          rows={[
            ...(resourceKeys.length
              ? resourceKeys.map(resource => ({
                  name: resource,
                  value: runtimeResources[resource],
                }))
              : [{ name: 'Resources', value: '-' }]),
            {
              name: 'Reserved Nodes',
              value: reservedNodes.length ? reservedNodes.join(', ') : '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the child queues section for a Queue.
 *
 * @param queue Queue shown in the details page.
 * @param queues All known queues.
 * @returns Child queues section descriptor or `null` when there are no children.
 */
function getChildQueuesSection(queue: VolcanoQueue, queues: VolcanoQueue[] | null) {
  if (!queues?.length) {
    return null;
  }

  const childQueues = queues.filter(candidate => candidate.spec.parent === queue.getName());

  if (!childQueues.length) {
    return null;
  }

  return {
    id: 'child-queues',
    section: (
      <SectionBox title="Child Queues">
        <SimpleTable
          data={childQueues}
          columns={[
            {
              label: 'Name',
              getter: (childQueue: VolcanoQueue) => (
                <Link routeName="volcano-queue-detail" params={{ name: childQueue.getName() }}>
                  {childQueue.getName()}
                </Link>
              ),
              sort: (childQueue: VolcanoQueue) => childQueue.getName(),
            },
            {
              label: 'State',
              getter: (childQueue: VolcanoQueue) => (
                <StatusLabel status={getQueueStatusColor(childQueue.state)}>
                  {childQueue.state}
                </StatusLabel>
              ),
              sort: (childQueue: VolcanoQueue) => childQueue.state,
            },
            {
              label: 'Weight',
              getter: (childQueue: VolcanoQueue) => childQueue.weight,
              sort: (childQueue: VolcanoQueue) => childQueue.weight,
            },
            {
              label: 'Priority',
              getter: (childQueue: VolcanoQueue) => childQueue.priority,
              sort: (childQueue: VolcanoQueue) => childQueue.priority,
            },
          ]}
          showPagination={false}
        />
      </SectionBox>
    ),
  };
}

/**
 * Renders the Volcano Queue details page.
 *
 * @returns Queue details view with extra sections and events.
 */
export default function QueueDetail() {
  const { name } = useParams<{ name: string }>();
  const [queues] = VolcanoQueue.useList();
  const [podGroups] = VolcanoPodGroup.useList();
  const queuePodGroupStats = useMemo(() => getQueuePodGroupStats(podGroups), [podGroups]);

  return (
    <DetailsGrid
      resourceType={VolcanoQueue}
      name={name}
      withEvents
      actions={(queue: VolcanoQueue) => (queue ? getQueueActionButtons(queue) : [])}
      extraInfo={(queue: VolcanoQueue) =>
        queue && [
          {
            name: 'State',
            value: (
              <StatusLabel status={getQueueStatusColor(queue.state)}>{queue.state}</StatusLabel>
            ),
          },
          { name: 'Weight', value: queue.weight },
          { name: 'Priority', value: queue.priority },
          { name: 'Dequeue Strategy', value: queue.dequeueStrategy },
          { name: 'Reclaimable', value: queue.spec.reclaimable !== false ? 'Yes' : 'No' },
          {
            name: 'Parent Queue',
            value: queue.spec.parent ? (
              <Link routeName="volcano-queue-detail" params={{ name: queue.spec.parent }}>
                {queue.spec.parent}
              </Link>
            ) : (
              '-'
            ),
          },
        ]
      }
      extraSections={(queue: VolcanoQueue) =>
        queue &&
        [
          getQueueStatusSection(queue.metadata.name, queuePodGroupStats),
          getCapacityAllocatedSection(queue),
          getDeservedGuaranteeSection(queue),
          getReservationSection(queue),
          getChildQueuesSection(queue, queues),
        ].filter(Boolean)
      }
    />
  );
}
