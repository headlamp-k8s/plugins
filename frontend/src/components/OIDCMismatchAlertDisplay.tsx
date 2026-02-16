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

import { Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { clearOIDCMismatchError } from '../redux/oidcMismatchSlice';
import { RootState } from '../redux/reducers/reducers';
import { OIDCMismatchAlert } from './OIDCMismatchAlert';

/**
 * OIDCMismatchAlertDisplay shows all active OIDC mismatch errors
 * from the Redux store
 */
export function OIDCMismatchAlertDisplay() {
  const dispatch = useDispatch();
  const errors = useSelector((state: RootState) => state.oidcMismatch.errors);

  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1300, maxWidth: '400px' }}>
      {Object.entries(errors).map(([clusterName]) => (
        <Box key={clusterName} sx={{ mb: 2 }}>
          <OIDCMismatchAlert
            clusterName={clusterName}
            isModal={false}
            onDismiss={() => dispatch(clearOIDCMismatchError(clusterName))}
          />
        </Box>
      ))}
    </Box>
  );
}
