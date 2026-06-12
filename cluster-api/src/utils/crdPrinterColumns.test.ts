import { getExtraColumnsFromCrd, getExtraInfoFromPrinterColumns } from './crdPrinterColumns';

describe('CRD printer column helpers', () => {
  test('returns extra columns for the requested CRD version', () => {
    const columns: any = [{ name: 'Phase', type: 'string', jsonPath: '.status.phase' }];
    const crd: any = {
      jsonData: {
        spec: {
          versions: [
            { name: 'v1beta1', additionalPrinterColumns: columns },
            { name: 'v1beta2', additionalPrinterColumns: [] },
          ],
        },
      },
    };

    expect(getExtraColumnsFromCrd(crd, 'v1beta1')).toBe(columns);
    expect(getExtraColumnsFromCrd(crd, 'v1alpha4')).toEqual([]);
    expect(getExtraColumnsFromCrd(null, 'v1beta1')).toEqual([]);
  });

  test('evaluates JSONPath values and hides empty values', () => {
    const rows = getExtraInfoFromPrinterColumns(
      [
        { name: 'Phase', type: 'string', jsonPath: '.status.phase' },
        { name: 'Machines', type: 'string', jsonPath: '.status.machineNames[*]' },
        { name: 'Age', type: 'date', jsonPath: '.metadata.creationTimestamp' },
        { name: 'Missing', type: 'string', jsonPath: '.status.missing' },
      ],
      {
        metadata: { creationTimestamp: '2026-01-01T00:00:00Z' },
        status: { phase: 'Provisioned', machineNames: ['cp-0', 'worker-0'] },
      }
    );

    expect(rows).toEqual([
      { name: 'Phase', value: 'Provisioned', hide: false },
      { name: 'Machines', value: 'cp-0, worker-0', hide: false },
      { name: 'Missing', value: undefined, hide: true },
    ]);
  });
});
