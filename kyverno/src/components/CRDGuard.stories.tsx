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

import { Box, Typography } from '@mui/material';
import type { Meta } from '@storybook/react';
import type { KyvernoCRDStatus } from '../hooks/useKyvernoCRDs';
import { PureCRDGuard } from './CRDGuard';

export default {
  title: 'Kyverno/CRDGuard',
  component: PureCRDGuard,
} as Meta<typeof PureCRDGuard>;

const StoryContent = () => (
  <Box p={2}>
    <Typography>Kyverno content is available.</Typography>
  </Box>
);

const allAvailableStatus: KyvernoCRDStatus = {
  legacy: true,
  cel: true,
  cleanup: true,
  reports: true,
  exceptions: true,
  kyvernoV2Reports: true,
  ephemeralReports: true,
  loading: false,
};

const missingStatus: KyvernoCRDStatus = {
  legacy: false,
  cel: false,
  cleanup: false,
  reports: false,
  exceptions: false,
  kyvernoV2Reports: false,
  ephemeralReports: false,
  loading: false,
};

const loadingStatus: KyvernoCRDStatus = {
  ...missingStatus,
  loading: true,
};

export const Available = () => (
  <PureCRDGuard requires="legacy" status={allAvailableStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const Loading = () => (
  <PureCRDGuard requires="legacy" status={loadingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingLegacy = () => (
  <PureCRDGuard requires="legacy" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingCEL = () => (
  <PureCRDGuard requires="cel" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingCleanup = () => (
  <PureCRDGuard requires="cleanup" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingReports = () => (
  <PureCRDGuard requires="reports" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingExceptions = () => (
  <PureCRDGuard requires="exceptions" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingKyvernoV2Reports = () => (
  <PureCRDGuard requires="kyvernoV2Reports" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const MissingEphemeralReports = () => (
  <PureCRDGuard requires="ephemeralReports" status={missingStatus}>
    <StoryContent />
  </PureCRDGuard>
);

export const CustomMessage = () => (
  <PureCRDGuard
    requires="reports"
    status={missingStatus}
    message="Policy reports are not available in this cluster."
  >
    <StoryContent />
  </PureCRDGuard>
);
