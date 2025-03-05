import { HoverInfoLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeCondition, KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { localeDate, timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { parseDuration } from '../helpers';

export interface RemainingTimeDisplayProps {
  item: KubeObject;
}

function getNextReconciliationAttempt(item: KubeObject) {
  const interval = item?.jsonData.spec?.interval;
  const lastReadyCondition = item?.jsonData?.status?.conditions?.find(
    condition => condition.type === 'Ready'
  );

  if (!interval) {
    return -1;
  }

  let lastRecordedCheck: Date;

  // Use reconcile.fluxcd.io/requestedAt if no Ready condition is found
  if (lastReadyCondition) {
    lastRecordedCheck = new Date(lastReadyCondition.lastTransitionTime);
  } else {
    let lastHandledReconcile = item?.jsonData?.status?.lastHandledReconcileAt;

    if (!lastHandledReconcile) {
      lastHandledReconcile =
        item?.jsonData?.metadata?.annotations?.['reconcile.fluxcd.io/requestedAt'];
    }

    if (lastHandledReconcile) {
      lastRecordedCheck = new Date(lastHandledReconcile);
    }
  }

  // If there is no way to retrieve a last reconcile time, return -1
  if (!lastRecordedCheck) {
    return -1;
  }

  const intervalInMs = parseDuration(interval);

  // Calculate the last reconciliation attempt assuming there was an attempt at every interval,
  // starting from the last ready state.
  const nowAndLastReadyDiff = new Date().getTime() - lastRecordedCheck.getTime();
  const lastReconciliationAttempt =
    lastRecordedCheck.getTime() + Math.floor(nowAndLastReadyDiff / intervalInMs) * intervalInMs;
  const expectedTime = new Date(new Date(lastReconciliationAttempt).getTime() + intervalInMs);

  return expectedTime.getTime();
}

interface NextAttemptStatus {
  nextAttempt: number;
  isReconciling: boolean;
  lastReconcileUnknown: boolean;
  isStalled: boolean;
}

export default function RemainingTimeDisplay(props: RemainingTimeDisplayProps) {
  const { item } = props;
  const timeoutRef = React.useRef<number>();
  const [timeRemaining, setTimeRemaining] = React.useState<number>();
  const [nextAttemptStatus, setNextAttemptStatus] = React.useState<NextAttemptStatus>({
    nextAttempt: getNextReconciliationAttempt(item),
    isReconciling: false,
    lastReconcileUnknown: false,
    isStalled: false,
  });

  function updateNextAttemptStatus() {
    function isReconcilingCondition(condition: KubeCondition) {
      return (
        (condition.type === 'Ready' && condition.status === 'Unknown') ||
        (condition.type === 'Reconciling' && condition.status === 'True')
      );
    }

    const isReconciling = !!item?.jsonData?.status?.conditions?.find(condition =>
      isReconcilingCondition(condition)
    );
    const isStalled = !!item?.jsonData?.status?.conditions?.find(
      condition => condition.type === 'Stalled' && condition.status === 'True'
    );

    const nextAttempt = getNextReconciliationAttempt(item);
    setNextAttemptStatus({
      nextAttempt,
      isReconciling,
      lastReconcileUnknown: nextAttempt === -1,
      isStalled,
    });
  }

  React.useEffect(() => {
    updateNextAttemptStatus();
  }, [item]);

  React.useEffect(() => {
    const { nextAttempt, lastReconcileUnknown } = nextAttemptStatus;

    if (lastReconcileUnknown || nextAttempt === 0) {
      return;
    }

    const newTimeRemaining = new Date(nextAttempt).getTime() - new Date().getTime();

    // There are cases where the resource is not changed, i.e. the status is not changed but it
    // is still triggering the reconciliation. Like in the GitRepository case.
    if (newTimeRemaining <= 0) {
      updateNextAttemptStatus();
      return;
    }

    if (timeRemaining === undefined) {
      setTimeRemaining(newTimeRemaining);
    }

    const remainingTimeSecs = Math.floor(newTimeRemaining / 1000);

    // By default, we will update the time every second
    let timeoutTrigger = 1;

    // If we have still more than 1 hour left, we will update the time every hour
    if (remainingTimeSecs > 3600) {
      timeoutTrigger = 3600;
    } else if (remainingTimeSecs > 60) {
      // If we have still more than 1 minute left, we will update remaining seconds within the minute.
      // This ends up updating the time every minute.
      timeoutTrigger = remainingTimeSecs % 60;
    }

    if (!!timeoutRef.current) {
      window.clearInterval(timeoutRef.current);
    }

    // The trigger projection is not perfect, so if our remaining time is getting negative,
    // let's update in the next 5 seconds instead of 1 sec.
    if (timeRemaining <= 0) {
      timeoutTrigger = 5;
    }

    timeoutRef.current = window.setTimeout(() => {
      setTimeRemaining(newTimeRemaining);
    }, timeoutTrigger * 1000);
  }, [nextAttemptStatus, timeRemaining]);

  React.useEffect(() => {
    // Just to clear out any remaining timeouts when the component is unmounted
    if (!!timeoutRef.current) {
      window.clearInterval(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  return (
    <Box>
      {nextAttemptStatus.isStalled ? (
        <Typography>Stalled</Typography>
      ) : nextAttemptStatus.lastReconcileUnknown ? (
        <Typography>Unable to calculate</Typography>
      ) : nextAttemptStatus.isReconciling || timeRemaining <= 0 ? (
        <Typography>In progress…</Typography>
      ) : (
        <HoverInfoLabel
          label={`In ${timeAgo(nextAttemptStatus.nextAttempt)}`}
          hoverInfo={localeDate(new Date(nextAttemptStatus.nextAttempt))}
          icon="mdi:calendar"
        />
      )}
    </Box>
  );
}
