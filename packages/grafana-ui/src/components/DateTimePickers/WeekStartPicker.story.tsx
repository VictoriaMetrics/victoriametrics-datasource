import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/client-api';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { WeekStartPicker } from 'packages/grafana-ui/src';
import React from 'react';


import { withCenteredStory } from '../../utils/storybook/withCenteredStory';

const meta: ComponentMeta<typeof WeekStartPicker> = {
  title: 'Pickers and Editors/TimePickers/WeekStartPicker',
  component: WeekStartPicker,
  decorators: [withCenteredStory],
  parameters: {
    controls: {
      exclude: ['onBlur', 'onChange', 'inputId'],
    },
  },
};

export const Basic: ComponentStory<typeof WeekStartPicker> = (args) => {
  const [, updateArgs] = useArgs();
  return (
    <WeekStartPicker
      {...args}
      onChange={(newValue) => {
        action('onChange')(newValue);
        updateArgs({ value: newValue });
      }}
      onBlur={action('onBlur')}
    />
  );
};

export default meta;
