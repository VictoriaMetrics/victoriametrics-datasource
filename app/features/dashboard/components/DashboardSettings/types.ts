import { IconName } from 'packages/grafana-ui/src';
import { ComponentType } from 'react';

import { NavModel } from '@grafana/data';

import { DashboardModel } from '../../state';

export interface SettingsPage {
  id: string;
  title: string;
  icon: IconName;
  component: ComponentType<SettingsPageProps>;
  subTitle?: string;
}

export interface SettingsPageProps {
  dashboard: DashboardModel;
  sectionNav: NavModel;
  editIndex?: number;
}
