import {
  aggregateSparkResources,
  getScheduledSparkApplicationStatus,
  getSparkApplicationStatus,
  getSparkApplicationType,
} from './sparkUtils';

describe('Spark Utilities', () => {
  describe('getSparkApplicationStatus', () => {
    it('should return Pending for null/undefined', () => {
      expect(getSparkApplicationStatus(null).label).toBe('Pending');
      expect(getSparkApplicationStatus(undefined).label).toBe('Pending');
    });

    it('should return Running for RUNNING state', () => {
      const app = { status: { applicationState: { state: 'RUNNING' } } } as any;
      const status = getSparkApplicationStatus(app);
      expect(status.label).toBe('Running');
      expect(status.status).toBe('success');
    });

    it('should return Failed for FAILED state', () => {
      const app = { status: { applicationState: { state: 'FAILED' } } } as any;
      const status = getSparkApplicationStatus(app);
      expect(status.label).toBe('Failed');
      expect(status.status).toBe('error');
    });

    it('should handle underscores in states', () => {
      const app = { status: { applicationState: { state: 'SUBMISSION_FAILED' } } } as any;
      const status = getSparkApplicationStatus(app);
      expect(status.label).toBe('Submission Failed');
      expect(status.status).toBe('error');
    });
  });

  describe('getScheduledSparkApplicationStatus', () => {
    it('should return Suspended when suspended', () => {
      const app = { spec: { suspend: true } } as any;
      const status = getScheduledSparkApplicationStatus(app);
      expect(status.label).toBe('Suspended');
      expect(status.status).toBe('warning');
    });

    it('should return Scheduled for normal state', () => {
      const app = { spec: { suspend: false }, status: { scheduleState: 'Scheduled' } } as any;
      const status = getScheduledSparkApplicationStatus(app);
      expect(status.label).toBe('Scheduled');
    });
  });

  describe('getSparkApplicationType', () => {
    it('should return Python for python', () => {
      const type = getSparkApplicationType('Python');
      expect(type.label).toBe('Python');
      expect(type.icon).toBe('mdi:language-python');
    });

    it('should return Scala for scala', () => {
      const type = getSparkApplicationType('Scala');
      expect(type.label).toBe('Scala');
    });
  });

  describe('aggregateSparkResources', () => {
    it('should aggregate resources correctly', () => {
      const apps = [
        {
          spec: {
            driver: { cores: 1, memory: '1Gi' },
            executor: { cores: 2, memory: '2Gi', instances: 2 },
          },
        },
      ] as any[];
      const totals = aggregateSparkResources(apps);
      expect(totals.cpu).toBe(5); // 1 + 2*2
      expect(totals.memory).toBe(5); // 1 + 2*2
    });
  });
});
