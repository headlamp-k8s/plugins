import path from 'path';
import initStoryshots from '../src';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, 'default_export'),
});
