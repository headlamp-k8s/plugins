export const ROLLOUT_DELAY_SECONDS = 15 * 60;

export interface StoryTimeline {
  revisionCreatedAt: readonly [number, number];
  usageChangedAt: number;
}

export function createStoryTimeline(now: number): StoryTimeline {
  const latestRevision = now - 3600;
  return {
    revisionCreatedAt: [now - 4 * 3600, latestRevision],
    usageChangedAt: latestRevision + ROLLOUT_DELAY_SECONDS,
  };
}

export function createStoryMetricValues(
  start: number,
  end: number,
  timeline: StoryTimeline,
  scale: number
): [number, string][] {
  return Array.from({ length: 31 }, (_, index) => {
    const timestamp = start + ((end - start) * index) / 30;
    const changed = timestamp >= timeline.usageChangedAt;
    const baseline = changed ? 0.65 : 0.3;
    const amplitude = changed ? 0.1 : 0.05;
    const value = baseline + Math.sin((timestamp - timeline.usageChangedAt) / 1800) * amplitude;
    return [timestamp, String(scale * value)];
  });
}
