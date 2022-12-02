// Copyright (c) 2022 Grafana Labs
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

import React, { memo } from 'react';

import { CoreApp } from '@grafana/data';
import { config } from '@grafana/runtime';

import { PromQueryEditorSelector } from '../querybuilder/components/PromQueryEditorSelector';

import { PromExploreQueryEditor } from './PromExploreQueryEditor';
import { PromQueryEditor } from './PromQueryEditor';
import { PromQueryEditorForAlerting } from './PromQueryEditorForAlerting';
import { PromQueryEditorProps } from './types';

export function PromQueryEditorByApp(props: PromQueryEditorProps) {
  const { app } = props;

  switch (app) {
    case CoreApp.CloudAlerting:
      return <PromQueryEditorForAlerting {...props} />;
    case CoreApp.Explore:
      if (config.featureToggles.promQueryBuilder) {
        return <PromQueryEditorSelector {...props} />;
      }
      return <PromExploreQueryEditor {...props} />;
    default:
      if (config.featureToggles.promQueryBuilder) {
        return <PromQueryEditorSelector {...props} />;
      }
      return <PromQueryEditor {...props} />;
  }
}

export default memo(PromQueryEditorByApp);
