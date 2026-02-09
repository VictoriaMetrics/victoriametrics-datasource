import React from "react";

import { DataSourcePluginOptionsEditorProps } from "@grafana/data";
import { InlineField, InlineSwitch } from "@grafana/ui";

import { AutocompleteSettings as AutocompleteSettingsType, PromOptions } from "../types";

type Props = Pick<DataSourcePluginOptionsEditorProps<PromOptions>, "options" | "onOptionsChange">;

export const AutocompleteSettings = (props: Props) => {
  const { options, onOptionsChange } = props;

  const onChangeHandler = (key: keyof AutocompleteSettingsType) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        autocompleteSettings: {
          ...options.jsonData.autocompleteSettings,
          [key]: event.currentTarget.checked,
        },
      },
    });
  };

  return (
    <>
      <h3 className="page-heading">Autocomplete</h3>
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineField
            label="Use optimized labels API"
            labelWidth={28}
            tooltip={
              <>
                When enabled, uses <code>/api/v1/labels</code> and <code>/api/v1/label/.../values</code> instead of{" "}
                <code>/api/v1/series</code> for autocomplete suggestions. This is more efficient for high-cardinality
                metrics. Falls back to <code>/api/v1/series</code> if the optimized API fails.
              </>
            }
            interactive={true}
          >
            <InlineSwitch
              value={options.jsonData.autocompleteSettings?.useOptimizedLabelsApi ?? true}
              onChange={onChangeHandler("useOptimizedLabelsApi")}
            />
          </InlineField>
        </div>
      </div>
    </>
  );
};

