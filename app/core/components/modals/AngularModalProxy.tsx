import { ModalRoot, ModalsProvider } from 'packages/grafana-ui/src';
import React from 'react';


import { connectWithProvider } from '../../utils/connectWithReduxStore';

/**
 * Component that enables rendering React modals from Angular
 */
export const AngularModalProxy = connectWithProvider((props: any) => {
  return (
    <>
      <ModalsProvider {...props}>
        <ModalRoot />
      </ModalsProvider>
    </>
  );
});
