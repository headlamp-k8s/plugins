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

import {
  EmptyContent,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  type KnativeSource,
  SOURCE_FAMILY,
  type SourceCloudEventAttributes,
} from '../../resources/knative';
import { DestinationLink } from '../common/DestinationLink';
import { DiscoveredKindDetail } from '../common/DiscoveredKindDetail';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';
import { getSettingsRow } from '../common/SettingsRow';

export const SOURCE_DETAILS_PATH = '/knative/sources/:namespace?/:name';

/**
 * Shows the attributes of the CloudEvents a Source sends, such as the event types a Trigger can
 * filter on.
 *
 * @param props - The attributes the Source reports.
 * @returns A section with one row per type and source.
 */
function CloudEventAttributes({
  attributes,
}: {
  /** The attributes the Source reports. */
  attributes?: SourceCloudEventAttributes[];
}) {
  return (
    <SectionBox title="CloudEvent Attributes">
      {attributes?.length ? (
        <SimpleTable
          data={attributes}
          columns={[
            {
              label: 'Type',
              getter: (attribute: SourceCloudEventAttributes) => (
                <TextValue value={attribute.type} />
              ),
            },
            {
              label: 'Source',
              getter: (attribute: SourceCloudEventAttributes) => (
                <TextValue value={attribute.source} />
              ),
            },
          ]}
        />
      ) : (
        <EmptyContent>This Source reports no CloudEvent attributes.</EmptyContent>
      )}
    </SectionBox>
  );
}

/**
 * Shows one Source of a known kind: its sink, the settings of its own kind, and the attributes of
 * the events it sends.
 *
 * @param props - The class of the Source's kind.
 * @returns The detail page.
 */
function SourcePage({
  kindClass,
}: {
  /** The class of the Source's kind. */
  kindClass: typeof KnativeSource;
}) {
  return (
    <EventingResourceDetail
      resourceType={kindClass}
      extraInfo={source => [
        {
          name: 'Sink',
          value: (
            <DestinationLink
              destination={source.sink}
              namespace={source.getNamespace()}
              cluster={source.cluster}
            />
          ),
        },
        { name: 'Sink URI', value: <TextValue value={source.status?.sinkUri} /> },
        getSettingsRow(kindClass.kind, source.settings),
      ]}
      extraSections={source => [
        {
          id: 'knative.source-cloudevent-attributes',
          section: <CloudEventAttributes attributes={source.status?.ceAttributes} />,
        },
      ]}
    />
  );
}

/**
 * Shows one Source of any kind, such as a PingSource or an ApiServerSource. It reads the Source's
 * CRD, named in the URL's `crd` query parameter, to know the kind; where the CRD cannot be read it
 * still shows Knative's own kinds.
 *
 * @returns The detail page, or a message when the URL names no CRD or the CRD cannot be used.
 */
export function SourceDetail() {
  return <DiscoveredKindDetail family={SOURCE_FAMILY} kindLabel="Source" page={SourcePage} />;
}
