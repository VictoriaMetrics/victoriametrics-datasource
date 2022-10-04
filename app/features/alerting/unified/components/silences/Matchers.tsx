import { css } from '@emotion/css';
import { Matcher } from 'app/plugins/datasource/alertmanager/types';
import { TagList, useStyles2 } from 'packages/grafana-ui/src';
import React, { FC } from 'react';


import { matcherToOperator } from '../../utils/alertmanager';

type MatchersProps = { matchers: Matcher[] };

export const Matchers: FC<MatchersProps> = ({ matchers }) => {
  const styles = useStyles2(getStyles);
  return (
    <div>
      <TagList
        className={styles.tags}
        tags={matchers.map((matcher) => `${matcher.name}${matcherToOperator(matcher)}${matcher.value}`)}
      />
    </div>
  );
};

const getStyles = () => ({
  tags: css`
    justify-content: flex-start;
  `,
});
