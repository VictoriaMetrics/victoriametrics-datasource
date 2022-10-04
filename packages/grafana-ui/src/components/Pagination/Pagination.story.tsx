import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Pagination } from 'packages/grafana-ui/src';
import React, { useState } from 'react';


import { withCenteredStory } from '../../utils/storybook/withCenteredStory';

import mdx from './Pagination.mdx';

const meta: ComponentMeta<typeof Pagination> = {
  title: 'Buttons/Pagination',
  component: Pagination,
  decorators: [withCenteredStory],
  parameters: {
    docs: {
      page: mdx,
    },
    controls: {
      exclude: ['currentPage', 'onNavigate'],
    },
  },
  argTypes: {
    numberOfPages: {
      control: {
        type: 'number',
        min: 1,
      },
    },
  },
};

export const WithPages: ComponentStory<typeof Pagination> = ({ numberOfPages, hideWhenSinglePage }) => {
  const [page, setPage] = useState(1);
  return (
    <Pagination
      numberOfPages={numberOfPages}
      currentPage={page}
      onNavigate={setPage}
      hideWhenSinglePage={hideWhenSinglePage}
    />
  );
};
WithPages.args = {
  numberOfPages: 5,
  hideWhenSinglePage: false,
};

export default meta;
