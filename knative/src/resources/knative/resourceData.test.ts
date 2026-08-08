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

import {
  collectIngressHosts,
  findReadyCondition,
  getFirstOwner,
  getRevisionName,
  getServingLabel,
} from './resourceData';

describe('Knative Serving resource data', () => {
  it('reads service and revision labels', () => {
    const metadata = {
      labels: {
        'serving.knative.dev/service': 'checkout',
        'serving.knative.dev/revision': 'checkout-00004',
      },
    };

    expect(getServingLabel(metadata, 'serving.knative.dev/service')).toBe('checkout');
    expect(getRevisionName(metadata, 'fallback-revision')).toBe('checkout-00004');
  });

  it('falls back to a referenced revision when the label is absent', () => {
    expect(getRevisionName({}, 'checkout-00004')).toBe('checkout-00004');
    expect(getRevisionName({})).toBeUndefined();
  });

  it('returns Unknown-ready inputs without throwing when status is absent', () => {
    expect(findReadyCondition(undefined)).toBeUndefined();
    expect(
      findReadyCondition({
        conditions: [
          { type: 'RoutesReady', status: 'True' },
          { type: 'Ready', status: 'False', reason: 'RevisionFailed' },
        ],
      })?.reason
    ).toBe('RevisionFailed');
  });

  it('deduplicates Ingress hosts and ignores missing host lists', () => {
    expect(
      collectIngressHosts([
        { hosts: ['checkout.demo.example.com', 'checkout.demo.svc.cluster.local'] },
        { hosts: ['checkout.demo.example.com'] },
        {},
      ])
    ).toEqual(['checkout.demo.example.com', 'checkout.demo.svc.cluster.local']);
    expect(collectIngressHosts(undefined)).toEqual([]);
  });

  it('prefers the controller owner reference and otherwise falls back to the first owner', () => {
    const nonControllerOwner = {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Configuration',
      name: 'checkout',
      uid: 'configuration-uid',
      blockOwnerDeletion: false,
      controller: false,
    };
    const controllerOwner = {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Route',
      name: 'checkout',
      uid: 'route-uid',
      blockOwnerDeletion: true,
      controller: true,
    };

    expect(getFirstOwner({ ownerReferences: [nonControllerOwner, controllerOwner] })).toEqual(
      controllerOwner
    );
    expect(getFirstOwner({ ownerReferences: [nonControllerOwner] })).toEqual(nonControllerOwner);
    expect(getFirstOwner({})).toBeUndefined();
  });
});
