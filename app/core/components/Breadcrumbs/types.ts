import { IconName } from 'packages/grafana-ui/src';

interface TextBreadcrumb {
  text: string;
  href: string;
}

interface IconBreadcrumb extends TextBreadcrumb {
  icon: IconName;
}

export type Breadcrumb = TextBreadcrumb | IconBreadcrumb;
