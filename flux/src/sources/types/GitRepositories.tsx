import React from 'react';
import { GitRepository } from '../../common/Resources';
import { SourceTypePage } from '../SourceTypePage';

export function GitRepositories() {
  return (
    <SourceTypePage
      resourceClass={GitRepository}
      pluralName="gitrepositories"
      title="Git Repositories"
    />
  );
}
