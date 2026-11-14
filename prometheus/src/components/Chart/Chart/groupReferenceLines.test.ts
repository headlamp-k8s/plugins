import { groupReferenceLines } from './groupReferenceLines';

const marker = (label: string, x: number) => ({
  label,
  x,
  tooltip: `Revision ${label}`,
  stroke: 'blue',
});

describe('groupReferenceLines', () => {
  it('groups coincident revisions without dropping their individual details', () => {
    const first = marker('r41', 100);
    const second = marker('r42', 100);
    expect(groupReferenceLines([second, first], 0, 200, 800)).toEqual([[second, first]]);
  });

  it('groups nearby labels according to the available chart width', () => {
    const lines = [marker('r41', 100), marker('r42', 120)];
    expect(groupReferenceLines(lines, 0, 200, 200)).toEqual([lines]);
    expect(groupReferenceLines(lines, 0, 200, 1000)).toEqual(lines.map(line => [line]));
  });

  it.each([
    { label: 'r42', spacing: 43 },
    { label: 'r1001', spacing: 57 },
  ])(
    'keeps $label clear of the previous marker hit target at $spacing pixels',
    ({ label, spacing }) => {
      const first = marker('r41', 50);
      const touching = marker(label, 50 + spacing);
      const overlapping = marker(label, 50 + spacing - 0.001);
      expect(groupReferenceLines([first, touching], 0, 200, 200)).toEqual([[first], [touching]]);
      expect(groupReferenceLines([first, overlapping], 0, 200, 200)).toEqual([
        [first, overlapping],
      ]);
    }
  );

  it('regroups earlier labels when a growing group would overlap them', () => {
    const lines = [marker('r1', 50), marker('r2', 95), marker('r3', 100)];
    expect(groupReferenceLines(lines, 0, 200, 200)).toEqual([lines]);
  });

  it('filters exact time boundaries and leaves ordinary reference lines unchanged', () => {
    const horizontal = { label: 'limit', y: 4, stroke: 'blue' };
    const ordinary = { label: 'threshold', x: 100, stroke: 'blue' };
    const first = marker('r1', 0);
    const last = marker('r2', 200);
    expect(
      groupReferenceLines(
        [marker('old', -1), first, last, marker('future', 201), horizontal, ordinary],
        0,
        200,
        800
      )
    ).toEqual([[horizontal], [ordinary], [first], [last]]);
  });

  it('handles a zero-duration range without losing coincident details', () => {
    const lines = [marker('r1', 100), marker('r2', 100)];
    expect(groupReferenceLines(lines, 100, 100, 800)).toEqual([lines]);
  });
});
