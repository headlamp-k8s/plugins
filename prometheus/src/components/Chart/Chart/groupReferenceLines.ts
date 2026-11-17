import type { ChartProps } from './Chart';

type ReferenceLine = NonNullable<ChartProps['referenceLines']>[number];

export const revisionMarkerLayout = {
  fontSize: 12,
  labelOffset: 4,
  hitTargetWidth: 24,
  gap: 6,
};

export function referenceLineId(line: ReferenceLine) {
  return `${line.label}:${line.x ?? line.y}`;
}

export function referenceGroupLabel(lines: ReferenceLine[]) {
  return lines.length === 1 ? lines[0].label : `${lines[0].label} +${lines.length - 1}`;
}

export function groupReferenceLines(
  lines: ReferenceLine[],
  from: number,
  to: number,
  width: number
): ReferenceLine[][] {
  const visible = lines.filter(line => line.x === undefined || (line.x >= from && line.x <= to));
  const ordinary = visible.filter(line => line.x === undefined || line.tooltip === undefined);
  const markers = visible
    .filter(line => line.x !== undefined && line.tooltip !== undefined)
    .sort((a, b) => a.x! - b.x!);
  const position = (line: ReferenceLine) =>
    to === from ? 0 : ((line.x! - from) / (to - from)) * width;
  const groups: ReferenceLine[][] = [];
  for (const marker of markers) {
    let group = [marker];
    while (groups.length) {
      const previous = groups[groups.length - 1];
      // Compact revision labels average about 7px per glyph at a 12px font.
      const characterWidth = revisionMarkerLayout.fontSize * (7 / 12);
      const labelWidth = referenceGroupLabel(group).length * characterWidth;
      const labelStart = position(group[0]) - revisionMarkerLayout.labelOffset - labelWidth;
      const previousTargetEnd = position(previous[0]) + revisionMarkerLayout.hitTargetWidth / 2;
      if (labelStart >= previousTargetEnd + revisionMarkerLayout.gap) break;
      groups.pop();
      group = [...previous, ...group];
    }
    groups.push(group);
  }
  return [...ordinary.map(line => [line]), ...groups];
}
