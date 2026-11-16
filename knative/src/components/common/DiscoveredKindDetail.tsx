/*
 * Copyright 2026 The Kubernetes Authors
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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { ComponentType } from 'react';
import { useLocation } from 'react-router-dom';
import { CustomResourceDefinition } from '../../resources/k8s/customResourceDefinition';
import { getKnativeCrdName } from '../../resources/knative';
import { getCrdKindInfo } from '../../resources/knative/eventingData';
import type { DiscoveredKindFamily } from '../../resources/knative/kindClass';

/** How to find the kind of the object a detail page shows, and how to show it. */
type DiscoveredKindDetailProps<C> = {
  /** How to find the kind. */
  family: DiscoveredKindFamily<C>;
  /** What the object is called in messages, such as `Source`. */
  kindLabel: string;
  /** Shows an object of a known kind. */
  page: ComponentType<{
    /** The class of the object's kind. */
    kindClass: C;
  }>;
};

/**
 * Shows one object of the kind a CRD defines, once the CRD is read.
 *
 * @param props - The CRD that defines the object's kind, and how to check and show it.
 * @returns The page, or a message when the CRD cannot be read, does not define these kinds or
 * serves no version.
 */
function DiscoveredKindOfCrd<C>({
  crd,
  family: { labelKey, excludedCrds = [], fallbackKinds, getKindClass },
  kindLabel,
  page: Page,
}: DiscoveredKindDetailProps<C> & {
  /** Name of the CRD, such as `pingsources.sources.knative.dev`. */
  crd: string;
}) {
  const cluster = K8s.useCluster();
  const [crdObject, error] = CustomResourceDefinition.useGet(crd, undefined, {
    cluster: cluster ?? undefined,
  });
  const problem = (reason: string) => (
    <EmptyContent color="error">
      {`The CustomResourceDefinition ${crd} ${reason}, so this ${kindLabel} cannot be shown.`}
    </EmptyContent>
  );

  if (!crdObject) {
    if (!error) return <Loader title={`Loading the ${kindLabel}'s CustomResourceDefinition`} />;
    const knativeKind = fallbackKinds.find(kind => getKnativeCrdName(kind) === crd);
    return knativeKind ? (
      <Page kindClass={getKindClass(knativeKind)} />
    ) : (
      problem('could not be read')
    );
  }

  const isDiscoveredKind =
    !excludedCrds.includes(crd) && crdObject.metadata.labels?.[labelKey] === 'true';
  if (!isDiscoveredKind) return problem(`does not define ${kindLabel}s`);

  const info = getCrdKindInfo(crdObject.jsonData);
  return info ? <Page kindClass={getKindClass(info)} /> : problem('serves no version');
}

/**
 * Shows one object of a kind found through a CRD label, such as a Source or a channel
 * implementation of any kind. It reads the object's CRD, named in the URL's `crd` query
 * parameter, to know the kind; where the CRD cannot be read it still shows Knative's own kinds.
 *
 * @param props - How to find the object's kind and how to show it.
 * @returns The page, or a message when the URL names no CRD or the CRD cannot be used.
 */
export function DiscoveredKindDetail<C>(props: DiscoveredKindDetailProps<C>) {
  const crd = new URLSearchParams(useLocation().search).get('crd');

  if (!crd) {
    return (
      <EmptyContent color="error">
        {`The link names no CustomResourceDefinition, so this ${props.kindLabel} cannot be shown.`}
      </EmptyContent>
    );
  }
  return <DiscoveredKindOfCrd key={crd} {...props} crd={crd} />;
}
