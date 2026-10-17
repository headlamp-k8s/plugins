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

import { DetailsGrid, type NameValueTableRow } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import type { ConditionedStatus } from '../../resources/knative/conditionedResource';
import ConditionsSection from './ConditionsSection';
import { NotInstalledBanner } from './NotInstalledBanner';

/**
 * Shows the detail page of a Knative Eventing resource: its metadata, the caller's rows, its
 * conditions, the caller's sections and its events, or a banner when Knative Eventing is not
 * installed.
 *
 * @param props - The resource class to load, and the rows and sections to show once the resource
 * is loaded.
 * @returns The detail page, or the banner.
 */
export function EventingResourceDetail<
  T extends KubeObjectClass & (abstract new (...args: never[]) => { status?: ConditionedStatus })
>({
  resourceType,
  extraInfo,
  extraSections,
}: {
  /** The resource class to load. */
  resourceType: T;
  /** Builds the rows shown below the metadata. */
  extraInfo: (item: InstanceType<T>) => NameValueTableRow[];
  /** Builds the sections shown after the conditions, each with an `id` unique on the page. */
  extraSections?: (item: InstanceType<T>) => {
    /** Identifies the section on the page. */
    id: string;
    /** The section's content. */
    section: ReactNode;
  }[];
}) {
  const { name, namespace } = useParams<{ namespace: string; name: string }>();
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('eventing', clusters);

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} component="eventing" />;
  }

  return (
    <DetailsGrid
      resourceType={resourceType}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item => (item ? extraInfo(item) : null)}
      extraSections={item => {
        if (!item) return [];
        const conditions = item.status?.conditions;
        return [
          ...(conditions
            ? [
                {
                  id: `knative.${resourceType.kind.toLowerCase()}-conditions`,
                  section: <ConditionsSection conditions={conditions} />,
                },
              ]
            : []),
          ...(extraSections?.(item) ?? []),
        ];
      }}
    />
  );
}
