import { Alert } from 'packages/grafana-ui/src';
import React, { FC } from 'react';

import { config } from '@grafana/runtime';

const EvaluationIntervalLimitExceeded: FC = () => (
  <Alert severity="warning" title="Global evalutation interval limit exceeded">
    A minimum evaluation interval of <strong>{config.unifiedAlerting.minInterval}</strong> has been configured in
    Grafana.
    <br />
    Please contact the administrator to configure a lower interval.
  </Alert>
);

export { EvaluationIntervalLimitExceeded };
