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

import { Icon } from '@iconify/react';
import { ActionButton, EditorDialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KRevision } from '../../../../resources/knative';
import { Activity } from '../../../common/activity/Activity';

type RevisionViewYamlHeaderButtonProps = {
  revision: KRevision;
};

function RevisionYamlActivityContent({
  revision,
  activityId,
}: {
  revision: KRevision;
  activityId: string;
}) {
  const name = revision.metadata.name ?? '';
  const namespace = revision.metadata.namespace ?? '';
  const cluster = revision.cluster;

  const [currentRevision] = KRevision.useGet(name, namespace, { cluster });

  return (
    <EditorDialog
      noDialog
      item={currentRevision?.jsonData ?? revision.jsonData}
      open
      allowToHideManagedFields
      onClose={() => Activity.close(activityId)}
      onSave={null}
    />
  );
}

export function RevisionViewYamlHeaderButton({ revision }: RevisionViewYamlHeaderButtonProps) {
  const activityId = `revision-yaml-${revision.metadata.uid ?? revision.metadata.name}`;

  const openYaml = () => {
    Activity.launch({
      id: activityId,
      title: revision.metadata.name,
      cluster: revision.cluster,
      icon: <Icon icon="mdi:eye" />,
      location: 'window',
      content: <RevisionYamlActivityContent revision={revision} activityId={activityId} />,
    });
  };

  return <ActionButton icon="mdi:eye" onClick={openYaml} description="View YAML" />;
}
