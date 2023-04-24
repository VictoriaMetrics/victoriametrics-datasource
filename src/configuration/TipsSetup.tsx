import React from "react";

import { Icon } from "@grafana/ui";

export const TipsSetup = () => {
  return (
    <div className="gf-form-group">
      <h6>Tips on how to setup</h6>

      <div className="submenu-controls">
        <div className="gf-form">
          <a
            className="gf-form-label gf-form-label--dashlink"
            href="https://docs.victoriametrics.com/Cluster-VictoriaMetrics.html#url-format"
            target="_blank"
            rel="noreferrer">
            <Icon name="file-alt"/>
            <span style={{ marginLeft: "4px" }}>Cluster VM</span>
          </a>
        </div>
        <div className="gf-form">
          <a
            className="gf-form-label gf-form-label--dashlink"
            href="https://docs.victoriametrics.com/Single-server-VictoriaMetrics.html#grafana-setup"
            target="_blank"
            rel="noreferrer">
            <Icon name="file-alt"/>
            <span style={{ marginLeft: "4px" }}>Grafana setup</span>
          </a>
        </div>
      </div>
    </div>
  )
}
