import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import Link from '@mui/material/Link';
import React, { ReactNode } from 'react';
import { useMongoDBCommunityInstalled } from '../utils/crdDetection';

const MONGODB_OPERATOR_DOCS_URL = 'https://www.mongodb.com/docs/kubernetes/current/';

/**
 * Guard component that displays an install guide if the MongoDBCommunity CRD is missing on the cluster.
 */
export default function MongoInstallGuard(props: { children: ReactNode }) {
  const { notInstalled, isLoading } = useMongoDBCommunityInstalled();

  if (isLoading) {
    return <Loader title="Checking for MongoDB operator..." />;
  }

  if (notInstalled) {
    return (
      <SectionBox title="MongoDB Community Operator not installed">
        <EmptyContent>
          <>
            This cluster does not have the MongoDBCommunity custom resource definition (
            <code>mongodbcommunity.mongodbcommunity.mongodb.com</code>
            ). Install the MongoDB Controllers for Kubernetes (MCK) operator to manage MongoDB
            replica sets. See the{' '}
            <Link
              href={MONGODB_OPERATOR_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              MongoDB operator installation documentation
            </Link>
            .
          </>
        </EmptyContent>
      </SectionBox>
    );
  }

  return <>{props.children}</>;
}
