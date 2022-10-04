// Libraries
import { Page } from 'app/core/components/Page/Page';
import { Card, Stack } from 'packages/grafana-ui/src';
import React, { FC } from 'react';


// Types
import { getScenes } from './scenes';

export interface Props {}

export const SceneListPage: FC<Props> = ({}) => {
  const scenes = getScenes();

  return (
    <Page navId="scenes">
      <Page.Contents>
        <Stack direction="column">
          {scenes.map((scene) => (
            <Card href={`/scenes/${scene.state.title}`} key={scene.state.title}>
              <Card.Heading>{scene.state.title}</Card.Heading>
            </Card>
          ))}
        </Stack>
      </Page.Contents>
    </Page>
  );
};

export default SceneListPage;
