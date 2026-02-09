// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-13: optimizations imports
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/victoriametrics-datasource
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { PureComponent } from 'react';

import store from '../store';

export interface Props<T> {
  storageKey: string;
  defaultValue: T;
  children: (value: T, onSaveToStore: (value: T) => void, onDeleteFromStore: () => void) => React.ReactNode;
}

interface State<T> {
  value: T;
}

export class LocalStorageValueProvider<T> extends PureComponent<Props<T>, State<T>> {
  constructor(props: Props<T>) {
    super(props);

    const { storageKey, defaultValue } = props;

    this.state = {
      value: store.getObject(storageKey, defaultValue),
    };
  }

  onSaveToStore = (value: T) => {
    const { storageKey } = this.props;
    try {
      store.setObject(storageKey, value);
    } catch (error) {
      console.error(error);
    }
    this.setState({ value });
  };

  onDeleteFromStore = () => {
    const { storageKey, defaultValue } = this.props;
    try {
      store.delete(storageKey);
    } catch (error) {
      console.log(error);
    }
    this.setState({ value: defaultValue });
  };

  render() {
    const { children } = this.props;
    const { value } = this.state;

    return <>{children(value, this.onSaveToStore, this.onDeleteFromStore)}</>;
  }
}
