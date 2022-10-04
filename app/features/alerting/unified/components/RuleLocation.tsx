import { Icon } from 'packages/grafana-ui/src';
import React, { FC } from 'react';


interface RuleLocationProps {
  namespace: string;
  group?: string;
}

const RuleLocation: FC<RuleLocationProps> = ({ namespace, group }) => {
  if (!group) {
    return <>{namespace}</>;
  }

  return (
    <>
      {namespace} <Icon name="angle-right" /> {group}
    </>
  );
};

export { RuleLocation };
