import { css } from '@emotion/css';
import { List } from 'packages/grafana-ui/src';
import React from 'react';

import { DataSourcePluginMeta } from '@grafana/data';

import { DataSourceTypeCard } from './DataSourceTypeCard';

export type Props = {
  // The list of data-source plugins to display
  dataSourcePlugins: DataSourcePluginMeta[];
  // Called when a data-source plugin is clicked on in the list
  onClickDataSourceType: (dataSource: DataSourcePluginMeta) => void;
};

export function DataSourceTypeCardList({ dataSourcePlugins, onClickDataSourceType }: Props) {
  if (!dataSourcePlugins || !dataSourcePlugins.length) {
    return null;
  }

  return (
    <List
      items={dataSourcePlugins}
      getItemKey={(item) => item.id.toString()}
      renderItem={(item) => <DataSourceTypeCard dataSourcePlugin={item} onClick={() => onClickDataSourceType(item)} />}
      className={css`
        > li {
          margin-bottom: 2px;
        }
      `}
    />
  );
}
