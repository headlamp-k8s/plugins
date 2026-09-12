/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { render, screen } from '@testing-library/react';
import type { KRevision, KService } from '../../../../resources/knative';
import { RevisionDeleteHeaderButton } from './RevisionDeleteHeaderButton';

const mocks = vi.hoisted(() => ({
  useGet: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: ({
    description,
    iconButtonProps,
  }: {
    description: string;
    iconButtonProps?: { disabled?: boolean };
  }) => <button disabled={iconButtonProps?.disabled}>{description}</button>,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('../../../../resources/knative', () => ({
  KRevision: class {},
  KService: { useGet: mocks.useGet },
}));

vi.mock('../permissions/RevisionPermissionsProvider', () => ({
  useRevisionPermissions: () => ({ canDeleteRevision: true, isLoading: false }),
}));

type QueryError = Error & { status?: number };
type TestService = KService & { traffic: Array<{ percent?: number; tag?: string }> };

function queryResult(
  data: KService | null,
  error: QueryError | null = null,
  isLoading = false
): ReturnType<typeof KService.useGet> {
  return Object.assign([data, error], {
    data,
    error,
    isError: error !== null,
    isLoading,
    isFetching: isLoading,
    isSuccess: !isLoading && error === null,
    status: isLoading ? 'pending' : error ? 'error' : 'success',
  }) as unknown as ReturnType<typeof KService.useGet>;
}

function makeService(traffic: Array<{ percent?: number; tag?: string }> = []): TestService {
  return { traffic } as TestService;
}

function makeRevision(parentService: string | undefined): KRevision {
  return {
    parentService,
    cluster: 'cluster-a',
    metadata: { name: 'revision', namespace: 'default' },
    getTrafficInService: vi.fn((service: TestService) => service.traffic),
  } as unknown as KRevision;
}

function renderButton(revision = makeRevision('service')) {
  render(<RevisionDeleteHeaderButton revision={revision} />);
  return screen.getByRole('button');
}

beforeEach(() => {
  mocks.useGet.mockReset();
});

describe('RevisionDeleteHeaderButton', () => {
  it('allows deletion when the Revision has no parent service', () => {
    mocks.useGet.mockReturnValue(queryResult(null));

    expect((renderButton(makeRevision(undefined)) as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables deletion while the parent KService query is loading', () => {
    mocks.useGet.mockReturnValue(queryResult(null, null, true));

    expect((renderButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it.each([403, 500])('disables deletion when the parent KService query fails with %s', status => {
    mocks.useGet.mockReturnValue(
      queryResult(null, Object.assign(new Error('request failed'), { status }))
    );

    expect((renderButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('allows deletion when the parent KService is confirmed absent', () => {
    mocks.useGet.mockReturnValue(
      queryResult(null, Object.assign(new Error('not found'), { status: 404 }))
    );

    expect((renderButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it('allows deletion when the loaded parent has no traffic', () => {
    mocks.useGet.mockReturnValue(queryResult(makeService()));

    expect((renderButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables deletion when the loaded parent sends traffic to the Revision', () => {
    mocks.useGet.mockReturnValue(queryResult(makeService([{ percent: 100 }])));

    expect((renderButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables deletion when the loaded parent tags the Revision', () => {
    mocks.useGet.mockReturnValue(queryResult(makeService([{ tag: 'stable' }])));

    expect((renderButton() as HTMLButtonElement).disabled).toBe(true);
  });
});
