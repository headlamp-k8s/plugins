describe('NodeClaim status condition extraction', () => {
  const getLastConditionReason = (jsonData: any) => {
    const conditions = jsonData?.status?.conditions;
    const lastCondition =
      Array.isArray(conditions) && conditions.length > 0
        ? conditions[conditions.length - 1]
        : null;
    return lastCondition?.reason || '-';
  };

  it('should return "-" when status is undefined', () => {
    const item = { jsonData: {} };
    expect(getLastConditionReason(item.jsonData)).toBe('-');
  });

  it('should return "-" when status.conditions is undefined', () => {
    const item = { jsonData: { status: {} } };
    expect(getLastConditionReason(item.jsonData)).toBe('-');
  });

  it('should return "-" when status.conditions is empty array', () => {
    const item = { jsonData: { status: { conditions: [] } } };
    expect(getLastConditionReason(item.jsonData)).toBe('-');
  });

  it('should return condition reason when status.conditions is populated', () => {
    const item = {
      jsonData: {
        status: {
          conditions: [
            { type: 'Building', reason: 'NodeBuilding' },
            { type: 'Ready', reason: 'NodeReady' },
          ],
        },
      },
    };
    expect(getLastConditionReason(item.jsonData)).toBe('NodeReady');
  });
});

describe('NodeClaim metadata labels extraction', () => {
  const getInstanceType = (jsonData: any) => {
    return jsonData?.metadata?.labels?.['node.kubernetes.io/instance-type'] || '-';
  };

  const getCapacityType = (jsonData: any) => {
    return jsonData?.metadata?.labels?.['karpenter.sh/capacity-type'] || '-';
  };

  const getZone = (jsonData: any) => {
    return jsonData?.metadata?.labels?.['topology.kubernetes.io/zone'] || '-';
  };

  it('should return "-" when metadata is undefined', () => {
    const item = { jsonData: {} };
    expect(getInstanceType(item.jsonData)).toBe('-');
    expect(getCapacityType(item.jsonData)).toBe('-');
    expect(getZone(item.jsonData)).toBe('-');
  });

  it('should return "-" when labels is undefined', () => {
    const item = { jsonData: { metadata: {} } };
    expect(getInstanceType(item.jsonData)).toBe('-');
    expect(getCapacityType(item.jsonData)).toBe('-');
    expect(getZone(item.jsonData)).toBe('-');
  });

  it('should return label values when labels is populated', () => {
    const item = {
      jsonData: {
        metadata: {
          labels: {
            'node.kubernetes.io/instance-type': 'm5.large',
            'karpenter.sh/capacity-type': 'on-demand',
            'topology.kubernetes.io/zone': 'us-east-1a',
          },
        },
      },
    };
    expect(getInstanceType(item.jsonData)).toBe('m5.large');
    expect(getCapacityType(item.jsonData)).toBe('on-demand');
    expect(getZone(item.jsonData)).toBe('us-east-1a');
  });
});
