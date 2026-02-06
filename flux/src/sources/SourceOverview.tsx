import './SourceOverview.css';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  BucketRepository,
  ExternalArtifact,
  GitRepository,
  HelmChart,
  HelmRepository,
  OCIRepository,
} from '../common/Resources';

interface SourceTypeCard {
  title: string;
  description: string;
  pluralName: string;
  resourceClass: KubeObjectClass;
  path: string;
}

const sourceTypes: SourceTypeCard[] = [
  {
    title: 'External Artifacts',
    description: 'External artifact sources',
    pluralName: 'externalartifacts',
    resourceClass: ExternalArtifact,
    path: '/flux/sources/externalartifacts',
  },
  {
    title: 'Git Repositories',
    description: 'Git repository sources',
    pluralName: 'gitrepositories',
    resourceClass: GitRepository,
    path: '/flux/sources/gitrepositories',
  },
  {
    title: 'OCI Repositories',
    description: 'OCI registry sources',
    pluralName: 'ocirepositories',
    resourceClass: OCIRepository,
    path: '/flux/sources/ocirepositories',
  },
  {
    title: 'Buckets',
    description: 'Bucket storage sources',
    pluralName: 'buckets',
    resourceClass: BucketRepository,
    path: '/flux/sources/buckets',
  },
  {
    title: 'Helm Repositories',
    description: 'Helm chart repositories',
    pluralName: 'helmrepositories',
    resourceClass: HelmRepository,
    path: '/flux/sources/helmrepositories',
  },
  {
    title: 'Helm Charts',
    description: 'Helm charts from repositories',
    pluralName: 'helmcharts',
    resourceClass: HelmChart,
    path: '/flux/sources/helmcharts',
  },
];

export function SourceOverview() {
  const history = useHistory();

  const handleCardClick = (path: string) => {
    history.push(path);
  };

  return (
    <SectionBox title="Flux Sources">
      <div className="source-overview-container">
        {sourceTypes.map((sourceType) => (
          <div
            key={sourceType.pluralName}
            className="source-type-card"
            onClick={() => handleCardClick(sourceType.path)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (e.key === ' ') {
                  e.preventDefault();
                }
                handleCardClick(sourceType.path);
              }
            }}
          >
            <h3 className="source-type-title">{sourceType.title}</h3>
            <p className="source-type-description">{sourceType.description}</p>
            <div className="source-type-arrow">→</div>
          </div>
        ))}
      </div>
    </SectionBox>
  );
}
