import { LoadingPlaceholder } from 'packages/grafana-ui/src';
import React, { FC } from 'react';


interface Props {
  pageName?: string;
}

const PageLoader: FC<Props> = ({ pageName = '' }) => {
  const loadingText = `Loading ${pageName}...`;
  return (
    <div className="page-loader-wrapper">
      <LoadingPlaceholder text={loadingText} />
    </div>
  );
};

export default PageLoader;
