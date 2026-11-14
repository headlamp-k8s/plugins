import {
  createStoryMetricValues,
  createStoryTimeline,
  ROLLOUT_DELAY_SECONDS,
} from './revisionMarkers.storyData';

const now = 1794654000;

describe('revision marker story timing', () => {
  it('places the usage change fifteen minutes after the latest revision', () => {
    const timeline = createStoryTimeline(now);
    expect(timeline.usageChangedAt - timeline.revisionCreatedAt[1]).toBe(15 * 60);
    expect(timeline.revisionCreatedAt[0]).toBeLessThan(timeline.revisionCreatedAt[1]);
  });

  it.each([1, 1024 ** 2, 1024 ** 3])(
    'keeps usage at its baseline during rollout for scale %s',
    scale => {
      const timeline = createStoryTimeline(now);
      const values = createStoryMetricValues(
        timeline.revisionCreatedAt[1],
        timeline.revisionCreatedAt[1] + 30 * 60,
        timeline,
        scale
      );
      for (const [timestamp, value] of values) {
        if (timestamp < timeline.usageChangedAt) {
          expect(Number(value) / scale).toBeLessThanOrEqual(0.35);
        } else {
          expect(Number(value) / scale).toBeGreaterThanOrEqual(0.55);
        }
      }
      const firstSpike = values.find(([, value]) => Number(value) / scale >= 0.5);
      expect(firstSpike?.[0]).toBe(timeline.usageChangedAt);
    }
  );

  it('does not move the rollout timing when a later window is fetched', () => {
    const timeline = createStoryTimeline(now);
    for (const shift of [0, 600, 1800]) {
      const values = createStoryMetricValues(now - 6 * 3600 + shift, now + shift, timeline, 1);
      const firstSpike = values.find(([, value]) => Number(value) >= 0.5);
      expect(firstSpike).toBeDefined();
      expect(firstSpike![0] - timeline.revisionCreatedAt[1]).toBeGreaterThanOrEqual(
        ROLLOUT_DELAY_SECONDS
      );
    }
    expect(timeline.usageChangedAt).toBe(now - 3600 + ROLLOUT_DELAY_SECONDS);
  });

  it('returns the same value for an overlapping timestamp after refresh', () => {
    const timeline = createStoryTimeline(now);
    const first = createStoryMetricValues(now - 1800, now, timeline, 1);
    const refreshed = createStoryMetricValues(now - 1200, now + 600, timeline, 1);
    const timestamp = now - 600;
    expect(first.find(([time]) => time === timestamp)).toEqual(
      refreshed.find(([time]) => time === timestamp)
    );
  });
});
