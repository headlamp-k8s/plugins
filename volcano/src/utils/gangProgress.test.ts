import { getGangProgressLabel, getGangProgressPercent, getReadyMemberCount } from './gangProgress';

describe('getReadyMemberCount', () => {
  it('sums running and succeeded pods', () => {
    expect(getReadyMemberCount(3, 0)).toBe(3);
    expect(getReadyMemberCount(1, 2)).toBe(3);
    expect(getReadyMemberCount(0, 0)).toBe(0);
  });
});

describe('getGangProgressLabel', () => {
  it('reports met when ready reaches minMember', () => {
    expect(getGangProgressLabel(3, 3)).toBe('Gang requirement met');
    expect(getGangProgressLabel(1, 2)).toBe('Gang requirement met');
  });

  it('reports incomplete when ready is below minMember', () => {
    expect(getGangProgressLabel(3, 2)).toBe('Gang incomplete (2/3 ready)');
    expect(getGangProgressLabel(1, 0)).toBe('Gang incomplete (0/1 ready)');
  });

  it('returns dash when minMember is not set', () => {
    expect(getGangProgressLabel(0, 0)).toBe('-');
  });
});

describe('getGangProgressPercent', () => {
  it('returns percentage capped at 100', () => {
    expect(getGangProgressPercent(3, 3)).toBe(100);
    expect(getGangProgressPercent(3, 1)).toBe(33);
    expect(getGangProgressPercent(1, 0)).toBe(0);
  });

  it('returns null when minMember is not set', () => {
    expect(getGangProgressPercent(0, 0)).toBeNull();
  });

  it('does not round incomplete gangs to 100%', () => {
    expect(getGangProgressPercent(200, 199)).toBe(99);
  });
});
