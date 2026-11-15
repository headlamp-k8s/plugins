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

import { render } from '@testing-library/react';
import type React from 'react';
import { vi } from 'vitest';

/** The props of Headlamp's `Link` that the test records. */
type LinkProps = {
  /** The route to link to. */
  routeName: string;
  /** The route's parameters. */
  params: Record<string, string>;
};

const links = vi.hoisted(() => [] as LinkProps[]);

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ routeName, params, children }: LinkProps & { children?: React.ReactNode }) => {
    links.push({ routeName, params });
    return children;
  },
}));

vi.mock('../../resources/knative', () => {
  /**
   * Builds the static side of a resource class, as OwnerLink reads it.
   *
   * @param apiVersion - API version of the kind.
   * @param kind - The kind.
   * @param detailsRoute - The class's detail route; Headlamp's default is the kind.
   * @returns A stand-in for the class.
   */
  const resourceClass = (apiVersion: string, kind: string, detailsRoute = kind) => ({
    apiVersion,
    kind,
    apiName: `${kind.toLowerCase()}s`,
    detailsRoute,
  });
  return {
    getKnativeCrdName: (cls: { apiVersion: string; apiName: string }) =>
      `${cls.apiName}.${cls.apiVersion.split('/')[0]}`,
    KnativeBroker: resourceClass('eventing.knative.dev/v1', 'Broker', 'knativeBrokerDetails'),
    KnativeCertificate: resourceClass('networking.internal.knative.dev/v1alpha1', 'Certificate'),
    KnativeChannel: resourceClass('messaging.knative.dev/v1', 'Channel', 'knativeChannelDetails'),
    KnativeConfiguration: resourceClass('serving.knative.dev/v1', 'Configuration'),
    KnativeImage: resourceClass('caching.internal.knative.dev/v1alpha1', 'Image'),
    KnativeIngress: resourceClass('networking.internal.knative.dev/v1alpha1', 'Ingress'),
    KnativeMetric: resourceClass('autoscaling.internal.knative.dev/v1alpha1', 'Metric'),
    KnativePodAutoscaler: resourceClass(
      'autoscaling.internal.knative.dev/v1alpha1',
      'PodAutoscaler'
    ),
    KnativeRoute: resourceClass('serving.knative.dev/v1', 'Route'),
    KnativeServerlessService: resourceClass(
      'networking.internal.knative.dev/v1alpha1',
      'ServerlessService'
    ),
    KnativeSubscription: resourceClass(
      'messaging.knative.dev/v1',
      'Subscription',
      'knativeSubscriptionDetails'
    ),
    KnativeTrigger: resourceClass('eventing.knative.dev/v1', 'Trigger', 'knativeTriggerDetails'),
  };
});

import { OwnerLink } from './OwnerLink';

/**
 * Renders a link to an object of the given kind and returns the route it links to.
 *
 * @param apiVersion - API version of the object.
 * @param kind - Kind of the object.
 * @returns The route name and parameters of the link, or undefined when it renders no link.
 */
function linkTo(apiVersion: string, kind: string): LinkProps | undefined {
  links.length = 0;
  render(<OwnerLink owner={{ apiVersion, kind, name: 'item' }} namespace="ns" />);
  return links[0];
}

describe('OwnerLink', () => {
  it.each([
    ['eventing.knative.dev/v1', 'Broker', 'knativeBrokerDetails'],
    ['eventing.knative.dev/v1', 'Trigger', 'knativeTriggerDetails'],
    ['messaging.knative.dev/v1', 'Channel', 'knativeChannelDetails'],
    ['messaging.knative.dev/v1', 'Subscription', 'knativeSubscriptionDetails'],
    ['serving.knative.dev/v1', 'Service', 'kserviceDetails'],
    ['v1', 'Secret', 'Secret'],
    ['v1', 'ConfigMap', 'ConfigMap'],
  ])('links %s %s to its own page', (apiVersion, kind, routeName) => {
    expect(linkTo(apiVersion, kind)).toEqual({
      routeName,
      params: { namespace: 'ns', name: 'item' },
    });
  });

  it('links a Knative kind without its own page to the Custom Resource view', () => {
    expect(linkTo('serving.knative.dev/v1', 'Configuration')).toEqual({
      routeName: 'customresource',
      params: { crd: 'configurations.serving.knative.dev', namespace: 'ns', crName: 'item' },
    });
  });

  it('shows the name of a kind the plugin does not know', () => {
    expect(linkTo('example.com/v1', 'Widget')).toBeUndefined();
  });
});
