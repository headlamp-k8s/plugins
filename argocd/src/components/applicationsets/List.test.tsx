/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';
import ApplicationSetList from './List';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: () => null,
}));

describe('ApplicationSetList', () => {
  it('is explicitly read-only', () => {
    const element = ApplicationSetList();
    expect(element.props.headerProps.titleSideActions).toEqual([]);
    expect(element.props.enableRowActions).toBe(false);
    expect(element.props.enableRowSelection).toBe(false);
    expect(
      element.props.columns.map((column: string | { id: string }) =>
        typeof column === 'string' ? column : column.id
      )
    ).toContain('generated-applications');
  });
});
