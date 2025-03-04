import path from 'path';
import { mount, configure } from 'enzyme';
// @ts-expect-error (Converted from ts-ignore)
import Adapter from 'enzyme-adapter-react-16';
import initStoryshots from '../src';

configure({ adapter: new Adapter() });

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, 'exported_metadata'),
  renderer: mount,
});
