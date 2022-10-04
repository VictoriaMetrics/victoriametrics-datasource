import { HorizontalGroup, PluginSignatureBadge } from 'packages/grafana-ui/src';
import React from 'react';


import { CatalogPlugin } from '../types';

import { PluginEnterpriseBadge, PluginDisabledBadge, PluginInstalledBadge, PluginUpdateAvailableBadge } from './Badges';

type PluginBadgeType = {
  plugin: CatalogPlugin;
};

export function PluginListItemBadges({ plugin }: PluginBadgeType) {
  if (plugin.isEnterprise) {
    return (
      <HorizontalGroup height="auto" wrap>
        <PluginEnterpriseBadge plugin={plugin} />
        {plugin.isDisabled && <PluginDisabledBadge error={plugin.error} />}
        <PluginUpdateAvailableBadge plugin={plugin} />
      </HorizontalGroup>
    );
  }

  return (
    <HorizontalGroup height="auto" wrap>
      <PluginSignatureBadge status={plugin.signature} />
      {plugin.isDisabled && <PluginDisabledBadge error={plugin.error} />}
      {plugin.isInstalled && <PluginInstalledBadge />}
      <PluginUpdateAvailableBadge plugin={plugin} />
    </HorizontalGroup>
  );
}
