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

import { fireEvent, render, screen } from '@testing-library/react';
import type { KRevision, KService } from '../../../../resources/knative';
import { RevisionDeleteHeaderButton } from './RevisionDeleteHeaderButton';

const mocks = vi.hoisted(() => ({
  useGet: vi.fn(),
  deleteRevision: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: ({
    description,
    iconButtonProps,
    onClick,
  }: {
    description: string;
    iconButtonProps?: { disabled?: boolean };
    onClick?: () => void;
  }) => (
    <button disabled={iconButtonProps?.disabled} onClick={onClick}>
      {description}
    </button>
  ),
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

// Keep the real traffic check so the enabled/disabled assertions below exercise
// it, but capture what the deletion path is handed.
vi.mock('../hooks/useRevisionActions', async () => {
  const actual = await vi.importActual<typeof import('../hooks/useRevisionActions')>(
    '../hooks/useRevisionActions'
  );
  return {
    ...actual,
    useRevisionActions: () => ({
      ...actual.useRevisionActions(),
      deleteRevision: mocks.deleteRevision,
    }),
  };
});

type QueryError = Error & { status?: number };
type TestService = KService & { traffic: Array<{ percent?: number; tag?: string }> };

/**
 * Builds the tuple KService.useGet resolves to. The hook cannot produce data
 * together with an error: useKubeObject nulls the data as soon as the query
 * errors, and KService resolves to a single endpoint, so useEndpoints never
 * contributes an endpoint error of its own. Asserting that here keeps these
 * tests on states the resource can actually reach.
 */
function queryResult(
  data: KService | null,
  error: QueryError | null = null,
  isLoading = false
): ReturnType<typeof KService.useGet> {
  if (data && error) {
    throw new Error('useGet never returns data and an error together');
  }

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
  mocks.deleteRevision.mockReset();
});

describe('RevisionDeleteHeaderButton', () => {
  it('allows deletion when the Revision has no parent service', () => {
    mocks.useGet.mockReturnValue(queryResult(null));

    expect((renderButton(makeRevision(undefined)) as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables deletion and says it is loading while the parent KService query is pending', () => {
    mocks.useGet.mockReturnValue(queryResult(null, null, true));

    const button = renderButton() as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Loading Traffic...');
  });

  it.each([403, 500])(
    'disables deletion and reports unverifiable traffic when the parent KService query fails with %s',
    status => {
      mocks.useGet.mockReturnValue(
        queryResult(null, Object.assign(new Error('request failed'), { status }))
      );

      const button = renderButton() as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.textContent).toBe('Unable to verify traffic for this Revision.');
    }
  );

  it('allows deletion and hands the deletion path no parent when the parent is confirmed absent', () => {
    const revision = makeRevision('service');
    mocks.useGet.mockReturnValue(
      queryResult(null, Object.assign(new Error('not found'), { status: 404 }))
    );

    const button = renderButton(revision) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(mocks.deleteRevision).toHaveBeenCalledWith(revision, null);
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
