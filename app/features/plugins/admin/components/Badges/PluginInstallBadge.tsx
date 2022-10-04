import { Badge, useStyles2 } from 'packages/grafana-ui/src';
import React from 'react';


import { getBadgeColor } from './sharedStyles';

export function PluginInstalledBadge(): React.ReactElement {
  const customBadgeStyles = useStyles2(getBadgeColor);
  return <Badge text="Installed" color="orange" className={customBadgeStyles} />;
}
