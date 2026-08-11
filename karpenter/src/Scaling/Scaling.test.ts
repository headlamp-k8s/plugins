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
