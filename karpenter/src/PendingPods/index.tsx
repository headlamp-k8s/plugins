import { PodEvents } from './Events';

export const PendingPods = () => {
  return (
    <>
      <PodEvents reason="FailedScheduling" kind="Pod" phase="Pending" />
    </>
  );
};
