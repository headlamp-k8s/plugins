import React from 'react';
import { ExternalArtifact } from '../common/Resources';
import { SourceTypePage } from '../SourceTypePage';

export function ExternalArtifacts() {
  return (
    <SourceTypePage
      resourceClass={ExternalArtifact}
      pluralName="externalartifacts"
      title="External Artifacts"
    />
  );
}
