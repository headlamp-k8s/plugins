import { isKafkaReady, isTopicReady, isUserReady } from './crds';
import type { Kafka, KafkaTopic, KafkaUser } from './crds';

describe('CRD helper functions', () => {
  describe('isKafkaReady', () => {
    it('should return true when Kafka cluster is ready', () => {
      const kafka = {
        status: {
          conditions: [
            { type: 'Ready', status: 'True' }
          ]
        }
      } as Kafka;

      expect(isKafkaReady(kafka)).toBe(true);
    });

    it('should return false when Kafka cluster is not ready', () => {
      const kafka = {
        status: {
          conditions: [
            { type: 'Ready', status: 'False' }
          ]
        }
      } as Kafka;

      expect(isKafkaReady(kafka)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const kafka = {} as Kafka;

      expect(isKafkaReady(kafka)).toBe(false);
    });

    it('should return false when conditions are empty', () => {
      const kafka = {
        status: {
          conditions: []
        }
      } as Kafka;

      expect(isKafkaReady(kafka)).toBe(false);
    });
  });

  describe('isTopicReady', () => {
    it('should return true when topic is ready', () => {
      const topic = {
        status: {
          conditions: [
            { type: 'Ready', status: 'True' }
          ]
        }
      } as KafkaTopic;

      expect(isTopicReady(topic)).toBe(true);
    });

    it('should return false when topic is not ready', () => {
      const topic = {
        status: {
          conditions: [
            { type: 'Ready', status: 'False' }
          ]
        }
      } as KafkaTopic;

      expect(isTopicReady(topic)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const topic = {} as KafkaTopic;

      expect(isTopicReady(topic)).toBe(false);
    });

    it('should handle multiple conditions and find Ready condition', () => {
      const topic = {
        status: {
          conditions: [
            { type: 'Progressing', status: 'True' },
            { type: 'Ready', status: 'True' },
            { type: 'Available', status: 'True' }
          ]
        }
      } as KafkaTopic;

      expect(isTopicReady(topic)).toBe(true);
    });
  });

  describe('isUserReady', () => {
    it('should return true when user is ready', () => {
      const user = {
        status: {
          conditions: [
            { type: 'Ready', status: 'True' }
          ]
        }
      } as KafkaUser;

      expect(isUserReady(user)).toBe(true);
    });

    it('should return false when user is not ready', () => {
      const user = {
        status: {
          conditions: [
            { type: 'Ready', status: 'False' }
          ]
        }
      } as KafkaUser;

      expect(isUserReady(user)).toBe(false);
    });

    it('should return false when status is missing', () => {
      const user = {} as KafkaUser;

      expect(isUserReady(user)).toBe(false);
    });

    it('should return false when Ready condition is missing', () => {
      const user = {
        status: {
          conditions: [
            { type: 'Other', status: 'True' }
          ]
        }
      } as KafkaUser;

      expect(isUserReady(user)).toBe(false);
    });
  });
});
