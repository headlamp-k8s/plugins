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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { StageStatus } from '../types/pipecd';

const STATUS_LEVELS: Record<StageStatus, 'success' | 'warning' | 'error' | ''> = {
  STAGE_NOT_STARTED_YET: '',
  STAGE_RUNNING: 'warning',
  STAGE_SUCCESS: 'success',
  STAGE_FAILURE: 'error',
  STAGE_CANCELLED: '',
  STAGE_SKIPPED: '',
  STAGE_EXITED: '',
};

interface StageStatusLabelProps {
  status: StageStatus | undefined;
}

export function StageStatusLabel({ status }: StageStatusLabelProps): JSX.Element {
  const { t } = useTranslation();
  const labels: Record<StageStatus, string> = {
    STAGE_NOT_STARTED_YET: t('Not Started'),
    STAGE_RUNNING: t('Running'),
    STAGE_SUCCESS: t('Success'),
    STAGE_FAILURE: t('Failure'),
    STAGE_CANCELLED: t('Cancelled'),
    STAGE_SKIPPED: t('Skipped'),
    STAGE_EXITED: t('Exited'),
  };
  const resolved: StageStatus = status ?? 'STAGE_NOT_STARTED_YET';
  return <StatusLabel status={STATUS_LEVELS[resolved]}>{labels[resolved]}</StatusLabel>;
}
