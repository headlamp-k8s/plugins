vi.mock('@iconify/react', () => ({
  addIcon: vi.fn(),
}));

import { addIcon } from '@iconify/react';
import { registerCapiIcon } from './clusterapiIcon';

describe('cluster api icon registration', () => {
  test('registers CAPI icon with iconify', () => {
    registerCapiIcon();

    expect(addIcon).toHaveBeenCalledWith(
      'capi:logo',
      expect.objectContaining({
        body: expect.stringContaining('<svg'),
        width: 24,
        height: 24,
      })
    );
  });
});
