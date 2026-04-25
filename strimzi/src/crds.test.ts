import {
  isConnectReady,
  isKafkaReady,
  isTopicReady,
  isUserReady,
  type ReadyConditionResource,
} from './crds-helpers';

describe('CRD helper functions', () => {
  describe('isKafkaReady', () => {
    it('should return true when Kafka cluster is ready', () => {
      const kafka: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'True' }],
        },
      };

      expect(isKafkaReady(kafka)).toBe(true);
    });

    it('should return false when Kafka cluster is not ready', () => {
      const kafka: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'False' }],
        },
      };

      expect(isKafkaReady(kafka)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const kafka: ReadyConditionResource = {};

      expect(isKafkaReady(kafka)).toBe(false);
    });

    it('should return false when conditions are empty', () => {
      const kafka: ReadyConditionResource = {
        status: {
          conditions: [],
        },
      };

      expect(isKafkaReady(kafka)).toBe(false);
    });
  });

  describe('isTopicReady', () => {
    it('should return true when topic is ready', () => {
      const topic: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'True' }],
        },
      };

      expect(isTopicReady(topic)).toBe(true);
    });

    it('should return false when topic is not ready', () => {
      const topic: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'False' }],
        },
      };

      expect(isTopicReady(topic)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const topic: ReadyConditionResource = {};

      expect(isTopicReady(topic)).toBe(false);
    });

    it('should handle multiple conditions and find Ready condition', () => {
      const topic: ReadyConditionResource = {
        status: {
          conditions: [
            { type: 'Progressing', status: 'True' },
            { type: 'Ready', status: 'True' },
            { type: 'Available', status: 'True' },
          ],
        },
      };

      expect(isTopicReady(topic)).toBe(true);
    });
  });

  describe('isUserReady', () => {
    it('should return true when user is ready', () => {
      const user: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'True' }],
        },
      };

      expect(isUserReady(user)).toBe(true);
    });

    it('should return false when user is not ready', () => {
      const user: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'False' }],
        },
      };

      expect(isUserReady(user)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const user: ReadyConditionResource = {};

      expect(isUserReady(user)).toBe(false);
    });

    it('should return false when Ready condition is missing', () => {
      const user: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Other', status: 'True' }],
        },
      };

      expect(isUserReady(user)).toBe(false);
    });
  });

  describe('isConnectReady', () => {
    it('should return true when Connect cluster is ready', () => {
      const connect: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'True' }],
        },
      };

      expect(isConnectReady(connect)).toBe(true);
    });

    it('should return false when Connect cluster is not ready', () => {
      const connect: ReadyConditionResource = {
        status: {
          conditions: [{ type: 'Ready', status: 'False' }],
        },
      };

      expect(isConnectReady(connect)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const connect: ReadyConditionResource = {};

      expect(isConnectReady(connect)).toBe(false);
    });
  });
});
