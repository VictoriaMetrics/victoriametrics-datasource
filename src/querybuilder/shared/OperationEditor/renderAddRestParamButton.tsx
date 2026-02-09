import React from "react";

import { Button } from "@grafana/ui";

import { QueryBuilderOperationParamDef } from "../types";

import { OperationEditorStyles } from "./OperationEditor";

function renderAddRestParamButton(
  paramsDef: QueryBuilderOperationParamDef[],
  onAddRestParam: () => void,
  operationIndex: number,
  paramIndex: number,
  styles: OperationEditorStyles
) {
  const title = paramsDef.map(p => p.name).join(" & ");
  return (
    <div
      className={styles.restParam}
      key={`${paramIndex}-2`}
    >
      <Button
        size="sm"
        icon="plus"
        title={`Add ${title}`}
        variant="secondary"
        onClick={onAddRestParam}
        data-testid={`operations.${operationIndex}.add-rest-param`}
      >
        {title}
      </Button>
    </div>
  );
}

export default renderAddRestParamButton;
