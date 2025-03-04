import path from 'path';
import { render, screen, waitFor } from '@testing-library/react';
import initStoryshots, { Stories2SnapsConverter } from '../src';
import { EXPECTED_VALUE } from './exported_metadata/Async.stories.jsx';

initStoryshots({
  asyncJest: true,
  framework: 'react',
  integrityOptions: false,
  configPath: path.join(__dirname, 'exported_metadata'),

  // When async is true we need to provide a test method that
  // calls done() when at the end of the test method
  test: async ({ story, context, done }) => {
    expect(done).toBeDefined();

    // This is a storyOf Async (see ./required_with_context/Async.stories)
    if (context.kind === 'Async') {
      const converter = new Stories2SnapsConverter({ snapshotExtension: '.async.storyshot' });
      const snapshotFilename = converter.getSnapshotFileName(context);
      const storyElement = story.render();

      // Mount the component
      const { container } = render(storyElement);

      // The Async component should not contain the expected value
      expect(screen.queryByText(EXPECTED_VALUE)).toBeFalsy();

      await waitFor(() => {
        expect(screen.getByText(EXPECTED_VALUE)).toBeInTheDocument();
        expect(container.firstChild).toMatchSpecificSnapshot(snapshotFilename);
      });

      // finally mark test as done
      done();
    } else {
      // If not async, mark the test as done
      done();
    }
  },
});
