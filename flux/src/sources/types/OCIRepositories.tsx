import React from 'react';
import { OCIRepository } from '../../common/Resources';
import { SourceTypePage } from '../SourceTypePage';

export function OCIRepositories() {
  return (
    <SourceTypePage
      resourceClass={OCIRepository}
      pluralName="ocirepositories"
      title="OCI Repositories"
    />
  );
}
