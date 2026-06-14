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

import { Box, Button, Typography } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { PromptWidthProvider, usePromptWidth } from './PromptWidthContext';

export const promptWidthStoryInitialWidth = '400px';

function PromptWidthDemo() {
  const { promptWidth, setPromptWidth } = usePromptWidth();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Current width: {promptWidth}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setPromptWidth('300px')}>
          300px
        </Button>
        <Button variant="outlined" size="small" onClick={() => setPromptWidth('500px')}>
          500px
        </Button>
        <Button variant="outlined" size="small" onClick={() => setPromptWidth('80vw')}>
          80vw
        </Button>
      </Box>
      <Box
        sx={{
          width: promptWidth,
          height: 100,
          bgcolor: 'primary.light',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'width 0.3s ease',
        }}
      >
        <Typography color="primary.contrastText">Prompt area: {promptWidth}</Typography>
      </Box>
    </Box>
  );
}

export default {
  title: 'AI UI/PromptWidthContext',
  component: PromptWidthDemo,
} as Meta;

const Template: StoryFn = () => (
  <PromptWidthProvider initialWidth={promptWidthStoryInitialWidth}>
    <PromptWidthDemo />
  </PromptWidthProvider>
);

export const Default = Template.bind({});
