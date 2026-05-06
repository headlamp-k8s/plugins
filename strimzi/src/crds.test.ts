import {
  getConnectorDesiredState,
  isConnectReady,
  isConnectorPaused,
  isKafkaReady,
  isTopicReady,
  isUserReady,
  type KafkaConnectorLike,
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

  describe('isConnectorPaused', () => {
    it('should return true when spec.state is "paused"', () => {
      const connector: KafkaConnectorLike = { spec: { state: 'paused' } };
      expect(isConnectorPaused(connector)).toBe(true);
    });

    it('should return false when spec.state is "running"', () => {
      const connector: KafkaConnectorLike = { spec: { state: 'running' } };
      expect(isConnectorPaused(connector)).toBe(false);
    });

    it('should treat deprecated spec.pause=true as paused', () => {
      const connector: KafkaConnectorLike = { spec: { pause: true } };
      expect(isConnectorPaused(connector)).toBe(true);
    });

    it('should let spec.state win over spec.pause when both are set', () => {
      const connector: KafkaConnectorLike = {
        spec: { state: 'running', pause: true },
      };
      expect(isConnectorPaused(connector)).toBe(false);
    });

    it('should default to running (not paused) when neither field is set', () => {
      const connector: KafkaConnectorLike = { spec: {} };
      expect(isConnectorPaused(connector)).toBe(false);
    });
  });

  describe('getConnectorDesiredState', () => {
    it('should return spec.state when set', () => {
      expect(getConnectorDesiredState({ spec: { state: 'stopped' } })).toBe('stopped');
    });

    it('should normalise deprecated spec.pause=true to "paused"', () => {
      expect(getConnectorDesiredState({ spec: { pause: true } })).toBe('paused');
    });

    it('should default to "running" when nothing is set', () => {
      expect(getConnectorDesiredState({ spec: {} })).toBe('running');
    });

    it('should default to "running" when spec is missing', () => {
      expect(getConnectorDesiredState({})).toBe('running');
    });
  });
});
