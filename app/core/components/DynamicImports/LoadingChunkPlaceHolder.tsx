import { LoadingPlaceholder } from 'packages/grafana-ui/src';
import React, { FunctionComponent } from 'react';


export const LoadingChunkPlaceHolder: FunctionComponent = React.memo(() => (
  <div className="preloader">
    <LoadingPlaceholder text={'Loading...'} />
  </div>
));

LoadingChunkPlaceHolder.displayName = 'LoadingChunkPlaceHolder';
