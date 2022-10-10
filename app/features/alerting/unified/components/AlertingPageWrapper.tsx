import { Page } from 'app/core/components/Page/Page';
import React, { FC } from 'react';

import { NavModelItem } from '@grafana/data';

interface Props {
  pageId: string;
  isLoading?: boolean;
  pageNav?: NavModelItem;
}

export const AlertingPageWrapper: FC<Props> = ({ children, pageId, pageNav, isLoading }) => {
  return (
    <Page pageNav={pageNav} navId={pageId}>
      <Page.Contents isLoading={isLoading}>{children}</Page.Contents>
    </Page>
  );
};
