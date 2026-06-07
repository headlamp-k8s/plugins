// @vitest-environment jsdom
import * as previewAnnotations from '@kinvolk/headlamp-plugin/config/.storybook/preview';
import { composeStories, setProjectAnnotations } from '@storybook/react';
import { render as testingLibraryRender } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import * as GrafanaButtonStories from './components/GrafanaButton/GrafanaButtonPure.stories';
import * as SettingsStories from './components/Settings/SettingsPure.stories';

// Mock Canvas for XTerm.js used by Headlamp
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => ({} as any);
}

const annotations = setProjectAnnotations([previewAnnotations, { testingLibraryRender }]);
if (annotations.beforeAll) {
  beforeAll(annotations.beforeAll);
}

const settingsStories = composeStories(SettingsStories);
const grafanaButtonStories = composeStories(GrafanaButtonStories);

describe('SettingsPure Stories', () => {
  Object.values(settingsStories).forEach((Story: any) => {
    it(`renders ${Story.storyName} correctly`, () => {
      const { container } = testingLibraryRender(<Story />);
      expect(container).toMatchSnapshot();
    });
  });
});

describe('GrafanaButtonPure Stories', () => {
  Object.values(grafanaButtonStories).forEach((Story: any) => {
    it(`renders ${Story.storyName} correctly`, () => {
      const { container } = testingLibraryRender(<Story />);
      expect(container).toMatchSnapshot();
    });
  });
});
