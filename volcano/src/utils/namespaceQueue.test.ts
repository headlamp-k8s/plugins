import {
  getNamespaceQueueDequeueStrategy,
  getNamespaceQueueState,
  getResourceNames,
  isNamespaceQueueReclaimable,
} from './namespaceQueue';

describe('getNamespaceQueueState', () => {
  it('returns the observed state', () => {
    expect(getNamespaceQueueState('Open')).toBe('Open');
    expect(getNamespaceQueueState('Closed')).toBe('Closed');
  });

  it('falls back to Unknown while the controller has not reported a state', () => {
    expect(getNamespaceQueueState(undefined)).toBe('Unknown');
  });
});

describe('isNamespaceQueueReclaimable', () => {
  it('treats an unset value as reclaimable', () => {
    expect(isNamespaceQueueReclaimable(undefined)).toBe(true);
  });

  it('only returns false when reclaiming is explicitly disabled', () => {
    expect(isNamespaceQueueReclaimable(true)).toBe(true);
    expect(isNamespaceQueueReclaimable(false)).toBe(false);
  });
});

describe('getNamespaceQueueDequeueStrategy', () => {
  it('defaults to traverse', () => {
    expect(getNamespaceQueueDequeueStrategy(undefined)).toBe('traverse');
  });

  it('returns the configured strategy', () => {
    expect(getNamespaceQueueDequeueStrategy('fifo')).toBe('fifo');
    expect(getNamespaceQueueDequeueStrategy('traverse')).toBe('traverse');
  });
});

describe('getResourceNames', () => {
  it('returns each resource name once across maps', () => {
    expect(
      getResourceNames({ cpu: '2', memory: '4Gi' }, { cpu: '1' }, { 'nvidia.com/gpu': 1 })
    ).toEqual(['cpu', 'memory', 'nvidia.com/gpu']);
  });

  it('ignores missing maps', () => {
    expect(getResourceNames(undefined, { cpu: '2' }, undefined)).toEqual(['cpu']);
    expect(getResourceNames()).toEqual([]);
  });
});
