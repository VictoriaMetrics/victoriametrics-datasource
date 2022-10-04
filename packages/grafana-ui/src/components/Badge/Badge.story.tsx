import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Badge } from 'packages/grafana-ui/src';
import React from 'react';


import { iconOptions } from '../../utils/storybook/knobs';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';

import mdx from './Badge.mdx';

const meta: ComponentMeta<typeof Badge> = {
  title: 'Data Display/Badge',
  component: Badge,
  decorators: [withCenteredStory],
  parameters: {
    docs: { page: mdx },
  },
  argTypes: {
    icon: { options: iconOptions, control: { type: 'select' } },
    color: { control: 'select' },
    text: { control: 'text' },
  },
};

const Template: ComponentStory<typeof Badge> = (args) => <Badge {...args} />;

export const Basic = Template.bind({});

Basic.args = {
  text: 'Badge label',
  color: 'blue',
  icon: 'rocket',
};

export default meta;
