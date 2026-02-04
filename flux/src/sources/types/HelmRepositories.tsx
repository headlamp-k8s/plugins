import React from 'react';
import { HelmRepository } from '../common/Resources';
import { SourceTypePage } from '../SourceTypePage';

export function HelmRepositories() {
  return (
    <SourceTypePage
      resourceClass={HelmRepository}
      pluralName="helmrepositories"
      title="Helm Repositories"
    />
  );
}
