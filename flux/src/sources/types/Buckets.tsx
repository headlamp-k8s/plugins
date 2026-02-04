import React from 'react';
import { BucketRepository } from '../../common/Resources';
import { SourceTypePage } from '../SourceTypePage';

export function Buckets() {
  return (
    <SourceTypePage
      resourceClass={BucketRepository}
      pluralName="buckets"
      title="Buckets"
    />
  );
}
