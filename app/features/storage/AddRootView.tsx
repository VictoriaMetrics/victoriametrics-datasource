import { Button } from 'packages/grafana-ui/src';
import React from 'react';


import { StorageView } from './types';

interface Props {
  onPathChange: (p: string, v?: StorageView) => void;
}

export function AddRootView({ onPathChange }: Props) {
  return (
    <div>
      <div>TODO... Add ROOT</div>
      <Button variant="secondary" onClick={() => onPathChange('/')}>
        Cancel
      </Button>
    </div>
  );
}
