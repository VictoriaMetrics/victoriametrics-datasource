import { LoadingPlaceholder } from 'packages/grafana-ui/src';
import React from 'react';


export interface Props {
  text?: string;
}

export const Loader = ({ text = 'Loading...' }: Props) => {
  return (
    <div className="page-loader-wrapper">
      <LoadingPlaceholder text={text} />
    </div>
  );
};
