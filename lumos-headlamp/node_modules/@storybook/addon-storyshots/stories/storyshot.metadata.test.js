import path from 'path';
import initStoryshots from '../src';

// jest.mock('@storybook/node-logger');

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, 'exported_metadata'),
});
