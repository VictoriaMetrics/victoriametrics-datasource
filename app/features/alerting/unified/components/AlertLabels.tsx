import { TagList } from 'packages/grafana-ui/src';
import React from 'react';


type Props = { labels: Record<string, string>; className?: string };

export const AlertLabels = ({ labels, className }: Props) => {
  const pairs = Object.entries(labels).filter(([key]) => !(key.startsWith('__') && key.endsWith('__')));
  return (
    <div className={className}>
      <TagList tags={Object.values(pairs).map(([label, value]) => `${label}=${value}`)} />
    </div>
  );
};
