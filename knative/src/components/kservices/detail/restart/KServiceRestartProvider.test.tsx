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

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import type { KService } from '../../../../resources/knative';
import { KServiceRestartProvider, useKServiceRestart } from './KServiceRestartProvider';

const finishers = vi.hoisted(() => new Map<string, (callOnDone: boolean) => void>());

vi.mock('./KServiceRestartTracker', () => ({
  KServiceRestartTracker: (props: {
    cluster: string;
    namespace: string;
    serviceName: string;
    onFinished: (callOnDone: boolean) => void;
  }) => {
    finishers.set(props.serviceName, props.onFinished);
    const key = `${props.cluster}/${props.namespace}/${props.serviceName}`;
    return <span data-testid="tracker">{key}</span>;
  },
}));

/**
 * Builds the part of a Knative Service that the restart reads.
 *
 * @param name - Name of the Service.
 * @returns The Service, typed as a `KService`.
 */
function makeKService(name: string): KService {
  return { cluster: 'cluster-a', metadata: { namespace: 'default', name } } as KService;
}

/**
 * A button that restarts a Knative Service and says whether it is being restarted.
 *
 * @param props - The Service to restart, and what to call once the restart is done.
 * @returns The button.
 */
function Restarter({ kservice, onDone }: { kservice: KService | null; onDone?: () => void }) {
  const { restarting, restart } = useKServiceRestart(kservice);
  return (
    <button onClick={() => restart(onDone)}>
      {`${kservice?.metadata.name ?? 'none'}: ${restarting ? 'restarting' : 'idle'}`}
    </button>
  );
}

describe('KServiceRestartProvider', () => {
  beforeEach(() => {
    finishers.clear();
  });

  it('starts a tracker for the Service and says it is being restarted', () => {
    render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} />
      </KServiceRestartProvider>
    );
    expect(screen.queryByTestId('tracker')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'service-a: idle' }));

    expect(screen.getByTestId('tracker').textContent).toBe('cluster-a/default/service-a');
    expect(screen.getByRole('button', { name: 'service-a: restarting' })).toBeTruthy();
  });

  it('starts no second restart of a Service that is being restarted', () => {
    render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} />
        <Restarter kservice={makeKService('service-a')} />
      </KServiceRestartProvider>
    );

    const [first, second] = screen.getAllByRole('button');
    fireEvent.click(first);
    fireEvent.click(second);

    expect(screen.getAllByTestId('tracker')).toHaveLength(1);
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual([
      'service-a: restarting',
      'service-a: restarting',
    ]);
  });

  it('restarts different Services side by side', () => {
    render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} />
        <Restarter kservice={makeKService('service-b')} />
      </KServiceRestartProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'service-a: idle' }));
    fireEvent.click(screen.getByRole('button', { name: 'service-b: idle' }));

    expect(screen.getAllByTestId('tracker').map(tracker => tracker.textContent)).toEqual([
      'cluster-a/default/service-a',
      'cluster-a/default/service-b',
    ]);
  });

  it('calls onDone and ends the restart when the restart reached the running Deployments', () => {
    const onDone = vi.fn();
    render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} onDone={onDone} />
      </KServiceRestartProvider>
    );
    fireEvent.click(screen.getByRole('button'));

    act(() => finishers.get('service-a')!(true));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('tracker')).toBeNull();
    expect(screen.getByRole('button', { name: 'service-a: idle' })).toBeTruthy();
  });

  it('ends the restart without onDone when the restart reached no Deployment', () => {
    const onDone = vi.fn();
    render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} onDone={onDone} />
      </KServiceRestartProvider>
    );
    fireEvent.click(screen.getByRole('button'));

    act(() => finishers.get('service-a')!(false));

    expect(onDone).not.toHaveBeenCalled();
    expect(screen.queryByTestId('tracker')).toBeNull();
  });

  it('keeps the restart going when the component that started it is gone', () => {
    const onDone = vi.fn();
    const { rerender } = render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} onDone={onDone} />
      </KServiceRestartProvider>
    );
    fireEvent.click(screen.getByRole('button'));

    rerender(<KServiceRestartProvider>{null}</KServiceRestartProvider>);
    expect(screen.getByTestId('tracker')).toBeTruthy();

    act(() => finishers.get('service-a')!(true));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('tracker')).toBeNull();
  });

  it('can restart a Service again once the restart is over', () => {
    render(
      <KServiceRestartProvider>
        <Restarter kservice={makeKService('service-a')} />
      </KServiceRestartProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    act(() => finishers.get('service-a')!(true));

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getAllByTestId('tracker')).toHaveLength(1);
  });

  it('restarts nothing until the Service has loaded', () => {
    render(
      <KServiceRestartProvider>
        <Restarter kservice={null} />
      </KServiceRestartProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'none: idle' }));

    expect(screen.queryByTestId('tracker')).toBeNull();
  });

  it('cannot be used outside the provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useKServiceRestart(makeKService('service-a')))).toThrow(
      'useKServiceRestart must be used within a KServiceRestartProvider'
    );

    error.mockRestore();
  });
});
