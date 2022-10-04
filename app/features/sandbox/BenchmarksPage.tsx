import { EmotionPerfTest, VerticalGroup } from 'packages/grafana-ui/src';
import React, { FC } from 'react';


export const BenchmarksPage: FC = () => {
  return (
    <VerticalGroup>
      <EmotionPerfTest />
    </VerticalGroup>
  );
};

export default BenchmarksPage;
