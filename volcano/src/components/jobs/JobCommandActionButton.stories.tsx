import pauseIcon from '@iconify/icons-mdi/pause';
import playCircleIcon from '@iconify/icons-mdi/play-circle';
import type { Meta, StoryFn } from '@storybook/react';
import { SnackbarProvider } from 'notistack';
import { MemoryRouter } from 'react-router-dom';
import type { VolcanoJob } from '../../resources/job';
import JobCommandActionButton from './JobCommandActionButton';

const baseJob = {
  metadata: {
    name: 'example-job',
    namespace: 'default',
    uid: 'example-job-uid',
  },
  getNamespace() {
    return 'default';
  },
} as unknown as VolcanoJob;

const meta = {
  title: 'Jobs/JobCommandActionButton',
  component: JobCommandActionButton,
  decorators: [
    Story => (
      <SnackbarProvider>
        <MemoryRouter>
          <div
            style={{
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Story />
          </div>
        </MemoryRouter>
      </SnackbarProvider>
    ),
  ],
} satisfies Meta<typeof JobCommandActionButton>;

export default meta;

const Template: StoryFn<typeof JobCommandActionButton> = args => (
  <JobCommandActionButton {...args} />
);

export const Suspend = Template.bind({});
Suspend.args = {
  job: baseJob,
  label: 'Suspend',
  icon: pauseIcon,
  action: 'AbortJob',
  successMessage: 'Suspend command created for example-job',
  longDescription: 'Suspend this job (vcctl job suspend).',
};

export const Resume = Template.bind({});
Resume.args = {
  job: baseJob,
  label: 'Resume',
  icon: playCircleIcon,
  action: 'ResumeJob',
  successMessage: 'Resume command created for example-job',
  longDescription: 'Resume this job (vcctl job resume).',
};
