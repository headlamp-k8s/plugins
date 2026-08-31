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
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ArgoApplication } from '../../resources/application';
import {
  ApplicationSetCondition,
  ArgoApplicationSet,
  getGeneratedApplicationCount,
  isGeneratedApplication,
  safeRepositoryIdentifier,
} from '../../resources/applicationset';
import { getHealthStatus, getSyncStatus } from '../applications/statusHelpers';

function getGeneratedApplications(
  applications: ArgoApplication[],
  applicationSet: ArgoApplicationSet
): ArgoApplication[] {
  const unique = new Map<string, ArgoApplication>();
  applications.forEach(application => {
    if (isGeneratedApplication(application, applicationSet)) {
      unique.set(
        `${application.cluster}/${application.metadata.namespace}/${application.metadata.name}`,
        application
      );
    }
  });
  return [...unique.values()];
}

export default function ApplicationSetDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [applications, applicationsError] = ArgoApplication.useList({ namespace });

  return (
    <DetailsGrid
      resourceType={ArgoApplicationSet}
      name={name}
      namespace={namespace}
      noDefaultActions
      withEvents
      extraInfo={(applicationSet: ArgoApplicationSet) =>
        applicationSet
          ? [
              { name: 'Template Name', value: applicationSet.template?.metadata?.name ?? '-' },
              { name: 'Template Project', value: applicationSet.templateProject },
              {
                name: 'Template Destination',
                value:
                  [
                    applicationSet.templateDestination?.name ??
                      applicationSet.templateDestination?.server,
                    applicationSet.templateDestination?.namespace,
                  ]
                    .filter(Boolean)
                    .join(' / ') || '-',
              },
              { name: 'Health', value: applicationSet.healthStatus },
              {
                name: 'Generated Applications',
                value: getGeneratedCountLabel(applicationSet, applications),
              },
            ]
          : []
      }
      extraSections={(applicationSet: ArgoApplicationSet) =>
        applicationSet
          ? [
              getTemplateSection(applicationSet),
              getGeneratorsSection(applicationSet),
              getGeneratedApplicationsSection(applicationSet, applications, applicationsError),
              getConditionsSection(applicationSet),
            ].filter(Boolean)
          : []
      }
    />
  );
}

function getTemplateSection(applicationSet: ArgoApplicationSet) {
  const sources = applicationSet.templateSources;
  if (!sources.length) {
    return {
      id: 'template-sources',
      section: <SectionBox title="Template Sources">No template source is configured.</SectionBox>,
    };
  }

  return {
    id: 'template-sources',
    section: (
      <SectionBox title="Template Sources">
        <SimpleTable
          data={sources}
          columns={[
            {
              label: 'Repository',
              getter: source => safeRepositoryIdentifier(source.repoURL) || '-',
            },
            { label: 'Revision', getter: source => source.targetRevision || 'HEAD' },
            { label: 'Path / Chart', getter: source => source.path ?? source.chart ?? '-' },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getGeneratedCountLabel(
  applicationSet: ArgoApplicationSet,
  applications: ArgoApplication[] | null
): string {
  const liveCount = applications
    ? getGeneratedApplications(applications, applicationSet).length
    : undefined;
  const count = getGeneratedApplicationCount(applicationSet.status, liveCount);
  return count === undefined ? '—' : String(count);
}

function getGeneratorsSection(applicationSet: ArgoApplicationSet) {
  return {
    id: 'generators',
    section: (
      <SectionBox title="Generators">
        {applicationSet.generatorSummaries.length ? (
          <NameValueTable
            rows={applicationSet.generatorSummaries.map((summary, index) => ({
              name: `Generator ${index + 1}`,
              value: summary,
            }))}
          />
        ) : (
          'No generators are configured.'
        )}
      </SectionBox>
    ),
  };
}

function getGeneratedApplicationsSection(
  applicationSet: ArgoApplicationSet,
  applications: ArgoApplication[] | null,
  applicationsError: unknown
) {
  const verifiedLiveCount = applications
    ? getGeneratedApplications(applications, applicationSet).length
    : undefined;
  const controllerCount = getGeneratedApplicationCount(applicationSet.status, verifiedLiveCount);
  if (applicationsError) {
    return {
      id: 'generated-applications',
      section: (
        <SectionBox title="Generated Applications">
          {controllerCount === undefined
            ? 'Generated Application status could not be loaded.'
            : `The controller reports ${controllerCount} generated Application${
                controllerCount === 1 ? '' : 's'
              }, but their status could not be loaded.`}
        </SectionBox>
      ),
    };
  }
  if (!applications) {
    return {
      id: 'generated-applications',
      section: (
        <SectionBox title="Generated Applications">Loading generated Applications…</SectionBox>
      ),
    };
  }

  const generatedApplications = getGeneratedApplications(applications, applicationSet);
  if (!generatedApplications.length) {
    return {
      id: 'generated-applications',
      section: (
        <SectionBox title="Generated Applications">
          {controllerCount === undefined
            ? 'No generated Applications have been observed yet.'
            : `The controller reports ${controllerCount} generated Application${
                controllerCount === 1 ? '' : 's'
              }, but none are currently available to list.`}
        </SectionBox>
      ),
    };
  }

  return {
    id: 'generated-applications',
    section: (
      <SectionBox title="Generated Applications">
        <SimpleTable
          data={generatedApplications}
          columns={[
            {
              label: 'Application',
              getter: application => (
                <Link
                  routeName="argocd-application-detail"
                  params={{
                    namespace: application.metadata.namespace,
                    name: application.metadata.name,
                  }}
                  activeCluster={application.cluster}
                >
                  {application.metadata.name}
                </Link>
              ),
            },
            {
              label: 'Sync',
              getter: application => (
                <StatusLabel status={getSyncStatus(application.syncStatus)}>
                  {application.syncStatus}
                </StatusLabel>
              ),
            },
            {
              label: 'Health',
              getter: application => (
                <StatusLabel status={getHealthStatus(application.healthStatus)}>
                  {application.healthStatus}
                </StatusLabel>
              ),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getConditionsSection(applicationSet: ArgoApplicationSet) {
  const conditions = applicationSet.conditions;
  if (!conditions.length) {
    return {
      id: 'conditions',
      section: (
        <SectionBox title="Conditions">No controller conditions have been reported.</SectionBox>
      ),
    };
  }
  return {
    id: 'conditions',
    section: (
      <SectionBox title="Conditions">
        <SimpleTable
          data={conditions}
          columns={[
            { label: 'Type', getter: (condition: ApplicationSetCondition) => condition.type },
            {
              label: 'Status',
              getter: (condition: ApplicationSetCondition) => condition.status ?? '-',
            },
            {
              label: 'Reason',
              getter: (condition: ApplicationSetCondition) => condition.reason ?? '-',
            },
            {
              label: 'Message',
              getter: (condition: ApplicationSetCondition) => condition.message ?? '-',
            },
            {
              label: 'Last Transition',
              getter: (condition: ApplicationSetCondition) => condition.lastTransitionTime ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

export { getGeneratedApplications };
