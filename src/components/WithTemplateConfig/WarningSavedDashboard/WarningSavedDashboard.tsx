import React, { FC } from "react";

import { Alert, Button, HorizontalGroup } from "@grafana/ui";

type Props = {
  onClose: () => void;
  onAccept: () => void
}

const WarningNewDashboard: FC<Props> = ({ onClose, onAccept }) => (
  <Alert
    title="Please save dashboard before using WITH templates"
    severity="error"
    elevated
  >
    <div>
      This dashboard is not saved yet. Please save it before using WITH templates.
      <p>Otherwise, the templates will not be saved</p>
    </div>
    <HorizontalGroup justify="flex-end" spacing="xs">
      <Button fill={"text"} onClick={onClose}>
        Cancel
      </Button>
      <Button variant={"destructive"} fill={"text"} onClick={onAccept}>
        Proceed with WITH templates
      </Button>
    </HorizontalGroup>
  </Alert>
)

export default WarningNewDashboard;
