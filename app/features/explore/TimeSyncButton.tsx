import { Tooltip, ToolbarButton } from 'packages/grafana-ui/src';
import React from 'react';


interface TimeSyncButtonProps {
  isSynced: boolean;
  onClick: () => void;
}

export function TimeSyncButton(props: TimeSyncButtonProps) {
  const { onClick, isSynced } = props;

  const syncTimesTooltip = () => {
    const { isSynced } = props;
    const tooltip = isSynced ? 'Unsync all views' : 'Sync all views to this time range';
    return <>{tooltip}</>;
  };

  return (
    <Tooltip content={syncTimesTooltip} placement="bottom">
      <ToolbarButton
        icon="link"
        variant={isSynced ? 'active' : 'default'}
        aria-label={isSynced ? 'Synced times' : 'Unsynced times'}
        onClick={onClick}
      />
    </Tooltip>
  );
}
